/**
 * security.h — SHA-256 hash verification + ECC-P256 signature verification
 *              + nonce/TTL replay-attack prevention.
 */
#pragma once
#include <stdbool.h>
#include <stdint.h>
#include <stddef.h>

/**
 * verify_sha256 - Compute SHA-256 of `image` and compare against expected_hex.
 * @image        : pointer to firmware image bytes
 * @len          : byte length of image
 * @expected_hex : null-terminated lowercase hex string (64 chars)
 * @return true if the digest matches.
 */
bool verify_sha256(const uint8_t *image, size_t len, const char *expected_hex);

/**
 * verify_ecc_signature - Verify ECDSA-P256 DER signature over a SHA-256 digest.
 * @hash32       : 32-byte SHA-256 digest of the firmware
 * @signature_b64: Base64-encoded DER signature from the manifest
 * @return true if the embedded public key validates the signature.
 */
bool verify_ecc_signature(const uint8_t hash32[32], const char *signature_b64);

/**
 * is_nonce_fresh - Check nonce uniqueness and issued_at + TTL window.
 * @nonce        : UUID string from the OTA command
 * @issued_at_iso: RFC3339 timestamp string ("2026-04-18T08:39:00Z")
 * @ttl_seconds  : Validity window in seconds (e.g. 300)
 * @return true if the command is still valid and the nonce has not been seen before.
 */
bool is_nonce_fresh(const char *nonce, const char *issued_at_iso, int ttl_seconds);
