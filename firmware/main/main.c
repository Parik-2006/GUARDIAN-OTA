/**
 * main.c — App entrypoint: initialize queues, start ECU tasks + OTA task + MQTT.
 *
 * This file is intentionally minimal — all logic lives in dedicated modules.
 */

#include "ecu_tasks.h"
#include "ota_handler.h"
#include "lcd.h"

#include "esp_event.h"
#include "esp_log.h"
#include "esp_mac.h"
#include "esp_netif.h"
#include "esp_sntp.h"
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include "freertos/task.h"
#include "nvs_flash.h"
#include "wifi_connect.h"

static const char *TAG = "main";

/* Global OTA queue handle — referenced by mqtt_transport.c */
QueueHandle_t g_ota_queue = NULL;

/* MQTT broker URI — dynamically sourced from Kconfig menuconfig */
#define MQTT_BROKER_URI CONFIG_ESP_MQTT_BROKER_URI

/* Forward declaration from mqtt_transport.c */
void mqtt_transport_start(const char *broker_uri);

/* ── SNTP time sync ───────────────────────────────────────────────────────── */
static void ntp_sync(void) {
    esp_sntp_setoperatingmode(SNTP_OPMODE_POLL);
    esp_sntp_setservername(0, "pool.ntp.org");
    esp_sntp_init();

    /* Wait up to 10 s for the clock to be set */
    int retry = 0;
    const int retry_max = 20;
    while (sntp_get_sync_status() == SNTP_SYNC_STATUS_RESET && retry < retry_max) {
        ESP_LOGI(TAG, "Waiting for NTP sync... (%d/%d)", ++retry, retry_max);
        vTaskDelay(pdMS_TO_TICKS(500));
    }

    time_t now;
    time(&now);
    if (sntp_get_sync_status() == SNTP_SYNC_STATUS_COMPLETED) {
        ESP_LOGI(TAG, "Time synced via NTP: epoch=%lld", (long long)now);
    } else {
        ESP_LOGW(TAG, "NTP sync timed out — TTL checks may fail if RTC is stale");
    }
}

void app_main(void) {
    /* ── System init ──────────────────────────────────────────────────── */
    ESP_ERROR_CHECK(nvs_flash_init());
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());

    uint8_t mac[6];
    esp_efuse_mac_get_default(mac);
    ESP_LOGI(TAG, "GUARDIAN-OTA node starting. MAC: %02X:%02X:%02X:%02X:%02X:%02X",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

    /* ── WiFi ────────────────────────────────────────────────────────── */
    wifi_init_sta();

    /* ── NTP time sync (required for OTA TTL / replay checks) ────────── */
    ntp_sync();

    /* ── Queues ──────────────────────────────────────────────────────── */
    ecu_init_can_queue();
    g_ota_queue = ota_init_queue();

    /* ── Hardware ────────────────────────────────────────────────────── */
    lcd_init();
    lcd_clear();
    lcd_set_cursor(0, 0);
    lcd_print("GUARDIAN-OTA");
    lcd_set_cursor(1, 0);
    lcd_print("BOOTING CORE...");

    /* ── ECU Tasks (priority 5) ──────────────────────────────────────── */
    xTaskCreate(brake_ecu_task,        "brake_ecu",   4096, NULL, 5, NULL);
    xTaskCreate(powertrain_ecu_task,   "powertrain",  4096, NULL, 5, NULL);
    xTaskCreate(sensor_ecu_task,       "sensor",      4096, NULL, 5, NULL);
    xTaskCreate(infotainment_ecu_task, "infotainment",4096, NULL, 5, NULL);

    /* ── OTA Task (priority 6 — above ECU, below time-critical ISRs) ─── */
    xTaskCreate(ota_task, "ota_task", 10240, NULL, 6, NULL);

    /* ── MQTT Transport (connects, subscribes, dispatches to OTA queue) ─ */
    mqtt_transport_start(MQTT_BROKER_URI);

    ESP_LOGI(TAG, "all tasks launched — waiting for OTA commands on %s", MQTT_BROKER_URI);
}
