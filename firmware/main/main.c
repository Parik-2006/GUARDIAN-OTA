#include <stdio.h>
#include <string.h>

#include "esp_event.h"
#include "esp_http_client.h"
#include "esp_https_ota.h"
#include "esp_log.h"
#include "esp_mac.h"
#include "esp_ota_ops.h"
#include "esp_system.h"
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include "freertos/task.h"
#include "mbedtls/base64.h"
#include "mbedtls/ecdsa.h"
#include "mbedtls/md.h"
#include "mbedtls/pk.h"
#include "mqtt_client.h"

static const char *TAG = "sdv";

typedef enum { ECU_BRAKE, ECU_POWERTRAIN, ECU_SENSOR, ECU_INFOTAINMENT } ecu_id_t;
typedef struct {
    ecu_id_t from;
    ecu_id_t to;
    char data[64];
} can_msg_t;

typedef struct {
    char version[32];
    char firmware_url[256];
    char firmware_hash[65];
    char signature_b64[256];
} ota_cmd_t;

static QueueHandle_t can_queue;
static QueueHandle_t ota_queue;
static bool g_safe_to_update = true;

static const char *pubkey_pem =
    "-----BEGIN PUBLIC KEY-----\n"
    "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEplaceholderplaceholder\n"
    "-----END PUBLIC KEY-----\n";

static void send_can(ecu_id_t from, ecu_id_t to, const char *msg) {
    can_msg_t m = {.from = from, .to = to};
    snprintf(m.data, sizeof(m.data), "%s", msg);
    xQueueSend(can_queue, &m, pdMS_TO_TICKS(10));
}

static void brake_ecu_task(void *arg) {
    while (1) {
        if ((esp_random() % 100) < 3) {
            g_safe_to_update = false;
            ESP_LOGW(TAG, "Brake ECU reported UNSAFE condition");
        } else {
            g_safe_to_update = true;
        }
        send_can(ECU_BRAKE, ECU_SENSOR, g_safe_to_update ? "SAFE" : "UNSAFE");
        vTaskDelay(pdMS_TO_TICKS(800));
    }
}

static void powertrain_ecu_task(void *arg) {
    while (1) {
        send_can(ECU_POWERTRAIN, ECU_BRAKE, "torque=42");
        vTaskDelay(pdMS_TO_TICKS(900));
    }
}

static void sensor_ecu_task(void *arg) {
    can_msg_t rx;
    while (1) {
        if (xQueueReceive(can_queue, &rx, pdMS_TO_TICKS(300)) == pdTRUE) {
            ESP_LOGI(TAG, "CAN %d->%d: %s", rx.from, rx.to, rx.data);
        }
    }
}

static void infotainment_ecu_task(void *arg) {
    while (1) {
        send_can(ECU_INFOTAINMENT, ECU_POWERTRAIN, "ui_heartbeat");
        vTaskDelay(pdMS_TO_TICKS(1100));
    }
}

static bool verify_hash(const uint8_t *image, size_t len, const char *expected_hex) {
    uint8_t digest[32];
    mbedtls_md_context_t ctx;
    mbedtls_md_init(&ctx);
    mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), 0);
    mbedtls_md_starts(&ctx);
    mbedtls_md_update(&ctx, image, len);
    mbedtls_md_finish(&ctx, digest);
    mbedtls_md_free(&ctx);

    char hex[65];
    for (int i = 0; i < 32; i++) {
        snprintf(hex + (i * 2), sizeof(hex) - (i * 2), "%02x", digest[i]);
    }
    return strncmp(hex, expected_hex, 64) == 0;
}

static bool verify_signature(const uint8_t *hash32, const char *signature_b64) {
    uint8_t sig[128];
    size_t sig_len = 0;
    if (mbedtls_base64_decode(sig, sizeof(sig), &sig_len, (const uint8_t *)signature_b64, strlen(signature_b64)) != 0) {
        return false;
    }

    mbedtls_pk_context pk;
    mbedtls_pk_init(&pk);
    if (mbedtls_pk_parse_public_key(&pk, (const uint8_t *)pubkey_pem, strlen(pubkey_pem) + 1) != 0) {
        mbedtls_pk_free(&pk);
        return false;
    }
    int rc = mbedtls_pk_verify(&pk, MBEDTLS_MD_SHA256, hash32, 0, sig, sig_len);
    mbedtls_pk_free(&pk);
    return rc == 0;
}

static void ota_task(void *arg) {
    ota_cmd_t cmd;
    while (1) {
        if (xQueueReceive(ota_queue, &cmd, portMAX_DELAY) != pdTRUE) {
            continue;
        }
        if (!g_safe_to_update) {
            ESP_LOGW(TAG, "OTA rejected: vehicle unsafe");
            continue;
        }

        esp_http_client_config_t http_cfg = {
            .url = cmd.firmware_url,
            .cert_pem = NULL, // set broker/root CA in production
            .timeout_ms = 15000,
        };

        esp_https_ota_config_t ota_cfg = {.http_config = &http_cfg};
        esp_err_t err = esp_https_ota(&ota_cfg);
        if (err != ESP_OK) {
            ESP_LOGE(TAG, "OTA failed, staying on previous partition");
            continue;
        }
        ESP_LOGI(TAG, "OTA complete for version %s, rebooting", cmd.version);
        esp_restart();
    }
}

static void mqtt_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data) {
    esp_mqtt_event_handle_t event = event_data;
    if (event_id == MQTT_EVENT_DATA) {
        ESP_LOGI(TAG, "MQTT rx %.*s", event->data_len, event->data);
        ota_cmd_t cmd = {0};
        snprintf(cmd.version, sizeof(cmd.version), "1.1.0");
        snprintf(cmd.firmware_url, sizeof(cmd.firmware_url), "https://firmware.example/esp32.bin");
        snprintf(cmd.firmware_hash, sizeof(cmd.firmware_hash), "placeholder");
        snprintf(cmd.signature_b64, sizeof(cmd.signature_b64), "MEUCIQ...");
        xQueueSend(ota_queue, &cmd, pdMS_TO_TICKS(30));
    }
}

void app_main(void) {
    uint8_t mac[6];
    esp_efuse_mac_get_default(mac);
    ESP_LOGI(TAG, "Device identity (eFuse MAC): %02X:%02X:%02X:%02X:%02X:%02X",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

    can_queue = xQueueCreate(20, sizeof(can_msg_t));
    ota_queue = xQueueCreate(4, sizeof(ota_cmd_t));

    xTaskCreate(brake_ecu_task, "brake_ecu", 4096, NULL, 5, NULL);
    xTaskCreate(powertrain_ecu_task, "powertrain_ecu", 4096, NULL, 5, NULL);
    xTaskCreate(sensor_ecu_task, "sensor_ecu", 4096, NULL, 5, NULL);
    xTaskCreate(infotainment_ecu_task, "infotainment_ecu", 4096, NULL, 5, NULL);
    xTaskCreate(ota_task, "ota_task", 8192, NULL, 6, NULL);

    esp_mqtt_client_config_t mqtt_cfg = {
        .broker.address.uri = "mqtts://broker.local:8883",
    };
    esp_mqtt_client_handle_t client = esp_mqtt_client_init(&mqtt_cfg);
    esp_mqtt_client_register_event(client, ESP_EVENT_ANY_ID, mqtt_event_handler, NULL);
    esp_mqtt_client_start(client);
}

