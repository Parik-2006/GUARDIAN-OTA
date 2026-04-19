/**
 * ota_handler.h — OTA task: MQTT payload parsing → safety gate → verification → HTTPS OTA.
 */
#pragma once
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"

/** Parsed OTA command received from the backend via MQTT */
typedef struct {
    char campaign_id  [48];
    char version      [32];
    char firmware_url [256];
    char firmware_hash[65];   /* SHA-256 hex, null-terminated */
    char signature_b64[344];  /* Base64 DER ECDSA-P256 signature */
    char nonce        [48];
    char issued_at    [32];   /* RFC3339 */
    int  ttl_seconds;
} ota_cmd_t;

/**
 * Initialise the OTA command queue.
 * @return QueueHandle that mqtt_transport posts ota_cmd_t items into.
 */
QueueHandle_t ota_init_queue(void);

/**
 * ota_task — FreeRTOS task that dequeues and executes OTA commands.
 * Blocks on the queue; performs safety gate check, hash verify, ECC verify,
 * HTTPS OTA download, reboot and rollback as needed.
 */
void ota_task(void *arg);

/**
 * Force an immediate rollback to the previous partition and reboot.
 */
void ota_rollback_and_reboot(void);

/**
 * Force a plain hardware reboot.
 */
void ota_reboot(void);
