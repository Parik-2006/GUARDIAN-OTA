/**
 * ota_handler.c — OTA task: full pipeline from MQTT command to reboot/rollback.
 *
 * Flow:
 *  1. Dequeue ota_cmd_t from ota_queue
 *  2. Check safety gate (brake ECU)
 *  3. Validate nonce/TTL (replay protection)
 *  4. Download firmware via esp_https_ota into a staging partition
 *  5. Verify SHA-256 over the downloaded image
 *  6. Verify ECC-P256 signature over the hash
 *  7a. If verification passes: mark partition valid, reboot
 *  7b. If verification fails: abort, stay on current partition
 *  8. If health check fails post-reboot: rollback via ESP-IDF dual-partition
 */

#include "ota_handler.h"
#include "ecu_tasks.h"
#include "security.h"

#include "esp_app_format.h"
#include "esp_http_client.h"
#include "esp_https_ota.h"
#include "esp_log.h"
#include "esp_ota_ops.h"
#include "esp_system.h"
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include "freertos/task.h"
#include "mbedtls/md.h"

#include <string.h>

static const char *TAG = "ota";

/* Root CA certificate for the MinIO/firmware server.
 * Embed with: CONFIG_ESP_HTTPS_OTA_ALLOW_HTTP=n and set server_cert_pem below.
 * For development, set NULL and enable allow_http in sdkconfig.
 */
extern const char ota_server_crt_pem[] asm("_binary_ota_server_crt_pem_start");
/* Use NULL if not embedding a cert (dev-only): */
#define OTA_SERVER_CERT NULL

static QueueHandle_t s_ota_queue = NULL;

/* ── Streaming hash context for download ────────────────────────────────── */
typedef struct {
    mbedtls_md_context_t md_ctx;
    esp_ota_handle_t     ota_handle;
    esp_partition_t     *ota_part;
    size_t               bytes_written;
} ota_write_ctx_t;

/* ── Queue init ─────────────────────────────────────────────────────────── */

QueueHandle_t ota_init_queue(void) {
    s_ota_queue = xQueueCreate(4, sizeof(ota_cmd_t));
    configASSERT(s_ota_queue);
    return s_ota_queue;
}

/* ── Publish status back via MQTT ───────────────────────────────────────── */
/* Forward-declared; implemented in mqtt_transport.c */
extern void mqtt_publish_status(const char *campaign_id, const char *status, const char *error);

/* ── OTA task ───────────────────────────────────────────────────────────── */

void ota_task(void *arg) {
    ota_cmd_t cmd;
    for (;;) {
        if (xQueueReceive(s_ota_queue, &cmd, portMAX_DELAY) != pdTRUE) {
            continue;
        }
        ESP_LOGI(TAG, "OTA command received: version=%s campaign=%s", cmd.version, cmd.campaign_id);
        mqtt_publish_status(cmd.campaign_id, "ack", NULL);

        /* ── 1. Safety gate ───────────────────────────────────────────── */
        if (!ecu_is_safe_to_update()) {
            ESP_LOGW(TAG, "OTA blocked: vehicle UNSAFE");
            mqtt_publish_status(cmd.campaign_id, "error", "vehicle_unsafe");
            continue;
        }

        /* ── 2. Replay protection ─────────────────────────────────────── */
        if (!is_nonce_fresh(cmd.nonce, cmd.issued_at, cmd.ttl_seconds)) {
            ESP_LOGW(TAG, "OTA blocked: stale or replayed command");
            mqtt_publish_status(cmd.campaign_id, "error", "replay_detected");
            continue;
        }

        /* ── 3. HTTPS OTA download ────────────────────────────────────── */
        mqtt_publish_status(cmd.campaign_id, "downloading", NULL);
        ESP_LOGI(TAG, "Downloading firmware from %s", cmd.firmware_url);

        esp_http_client_config_t http_cfg = {
            .url        = cmd.firmware_url,
            .cert_pem   = OTA_SERVER_CERT,
            .timeout_ms = 20000,
            .keep_alive_enable = true,
        };
        esp_https_ota_config_t ota_cfg = { .http_config = &http_cfg };

        esp_https_ota_handle_t ota_hdl = NULL;
        esp_err_t err = esp_https_ota_begin(&ota_cfg, &ota_hdl);
        if (err != ESP_OK) {
            ESP_LOGE(TAG, "esp_https_ota_begin failed: %s", esp_err_to_name(err));
            mqtt_publish_status(cmd.campaign_id, "error", "https_begin_failed");
            continue;
        }

        /* Hash context for streaming SHA-256 */
        mbedtls_md_context_t hash_ctx;
        mbedtls_md_init(&hash_ctx);
        const mbedtls_md_info_t *md_info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
        mbedtls_md_setup(&hash_ctx, md_info, 0);
        mbedtls_md_starts(&hash_ctx);

        /* Download loop */
        uint8_t chunk[1024];
        while (true) {
            err = esp_https_ota_perform(ota_hdl);
            if (err == ESP_ERR_HTTPS_OTA_IN_PROGRESS) {
                /* Feed each received chunk into the hash */
                int img_len = esp_https_ota_get_image_len_read(ota_hdl);
                (void)img_len;
                /* Note: esp_https_ota_perform is opaque — use streaming hash
                 * over ota partition directly after download completes instead. */
                continue;
            }
            break;
        }

        if (err != ESP_OK) {
            ESP_LOGE(TAG, "OTA download failed: %s", esp_err_to_name(err));
            esp_https_ota_abort(ota_hdl);
            mbedtls_md_free(&hash_ctx);
            mqtt_publish_status(cmd.campaign_id, "error", "download_failed");
            continue;
        }

        /* ── 4. Hash verification over downloaded partition ───────────── */
        mqtt_publish_status(cmd.campaign_id, "verifying", NULL);

        /* Read the partition back and compute SHA-256 */
        const esp_partition_t *update_part = esp_ota_get_next_update_partition(NULL);
        mbedtls_md_free(&hash_ctx);

        /* Re-init and hash the full partition image */
        mbedtls_md_init(&hash_ctx);
        mbedtls_md_setup(&hash_ctx, md_info, 0);
        mbedtls_md_starts(&hash_ctx);

        size_t img_size = (size_t)esp_https_ota_get_image_len_read(ota_hdl);
        size_t offset = 0;
        bool hash_ok = true;

        while (offset < img_size) {
            size_t to_read = (img_size - offset) < sizeof(chunk) ? (img_size - offset) : sizeof(chunk);
            esp_err_t rd_err = esp_partition_read(update_part, offset, chunk, to_read);
            if (rd_err != ESP_OK) {
                hash_ok = false;
                break;
            }
            mbedtls_md_update(&hash_ctx, chunk, to_read);
            offset += to_read;
        }

        uint8_t digest[32];
        mbedtls_md_finish(&hash_ctx, digest);
        mbedtls_md_free(&hash_ctx);

        if (!hash_ok) {
            esp_https_ota_abort(ota_hdl);
            mqtt_publish_status(cmd.campaign_id, "error", "partition_read_failed");
            continue;
        }

        /* Build hex string for comparison */
        char computed_hex[65] = {0};
        for (int i = 0; i < 32; i++) {
            snprintf(computed_hex + (i * 2), 3, "%02x", digest[i]);
        }
        if (strncmp(computed_hex, cmd.firmware_hash, 64) != 0) {
            ESP_LOGE(TAG, "SHA-256 MISMATCH — aborting OTA");
            esp_https_ota_abort(ota_hdl);
            mqtt_publish_status(cmd.campaign_id, "error", "hash_mismatch");
            continue;
        }
        ESP_LOGI(TAG, "SHA-256 verified: %.16s...", computed_hex);

        /* ── 5. ECC signature verification ───────────────────────────── */
        if (!verify_ecc_signature(digest, cmd.signature_b64)) {
            ESP_LOGE(TAG, "ECC signature INVALID — aborting OTA");
            esp_https_ota_abort(ota_hdl);
            mqtt_publish_status(cmd.campaign_id, "error", "sig_invalid");
            continue;
        }

        /* ── 6. Finalize and reboot ───────────────────────────────────── */
        err = esp_https_ota_finish(ota_hdl);
        if (err != ESP_OK) {
            ESP_LOGE(TAG, "esp_https_ota_finish failed: %s", esp_err_to_name(err));
            mqtt_publish_status(cmd.campaign_id, "error", "finalize_failed");
            continue;
        }

        ESP_LOGI(TAG, "OTA complete — version %s — rebooting", cmd.version);
        mqtt_publish_status(cmd.campaign_id, "success", NULL);
        vTaskDelay(pdMS_TO_TICKS(300)); /* let MQTT flush */
        esp_restart();
    }
}
