package blockchain

import (
	"context"
	"crypto/ecdsa"
	"errors"
	"fmt"
	"log/slog"
	"math/big"
	"os"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

type Service struct {
	client     *ethclient.Client
	privateKey *ecdsa.PrivateKey
	address    common.Address
}

func NewService() (*Service, error) {
	rpcUrl := os.Getenv("INFURA_RPC")
	if rpcUrl == "" {
		return nil, errors.New("INFURA_RPC not set in environment")
	}

	pkHex := os.Getenv("ETH_PRIVATE_KEY")
	if pkHex == "" {
		slog.Warn("ETH_PRIVATE_KEY not set, blockchain features will be read-only or fail")
	}

	client, err := ethclient.Dial(rpcUrl)
	if err != nil {
		return nil, err
	}

	var privateKey *ecdsa.PrivateKey
	var address common.Address

	if pkHex != "" {
		privateKey, err = crypto.HexToECDSA(pkHex)
		if err != nil {
			return nil, err
		}

		publicKey := privateKey.Public()
		publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
		if !ok {
			return nil, errors.New("error casting public key to ECDSA")
		}
		address = crypto.PubkeyToAddress(*publicKeyECDSA)
	}

	return &Service{
		client:     client,
		privateKey: privateKey,
		address:    address,
	}, nil
}

// LogFirmwareHash sends a 0-ETH transaction with the hash as data to log it immutably on Sepolia.
func (s *Service) LogFirmwareHash(ctx context.Context, version string, hash string) (string, error) {
	if s.privateKey == nil {
		return "", errors.New("cannot log firmware hash: ETH_PRIVATE_KEY not configured")
	}

	nonce, err := s.client.PendingNonceAt(ctx, s.address)
	if err != nil {
		return "", err
	}

	gasPrice, err := s.client.SuggestGasPrice(ctx)
	if err != nil {
		return "", err
	}

	chainID, err := s.client.NetworkID(ctx)
	if err != nil {
		return "", err
	}

	// Payload
	data := []byte(fmt.Sprintf("GUARDIAN-OTA:%s:%s", version, hash))

	// Estimate gas
	gasLimit, err := s.client.EstimateGas(ctx, common.CallMsg{
		From:     s.address,
		To:       &s.address,
		GasPrice: gasPrice,
		Data:     data,
	})
	if err != nil {
		// fallback limit
		gasLimit = 100000
	} else {
		// add some buffer
		gasLimit = gasLimit + 10000
	}

	tx := types.NewTx(&types.LegacyTx{
		Nonce:    nonce,
		To:       &s.address, // send to self
		Value:    big.NewInt(0),
		Gas:      gasLimit,
		GasPrice: gasPrice,
		Data:     data,
	})

	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), s.privateKey)
	if err != nil {
		return "", err
	}

	err = s.client.SendTransaction(ctx, signedTx)
	if err != nil {
		return "", err
	}

	txHash := signedTx.Hash().Hex()
	slog.Info("blockchain: firmware hash logged", "tx", txHash)
	return txHash, nil
}
