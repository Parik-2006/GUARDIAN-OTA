/**
 * main.c — App entrypoint: initialize queues, start ECU tasks + OTA task + MQTT.
 *
 * This file is intentionally minimal — all logic lives in dedicated modules.
 */

#include "ecu_tasks.h"
#include "ota_handler.h"

#include "esp_event.h"
#include "esp_log.h"
#include "esp_mac.h"
#include "esp_netif.h"
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include "freertos/task.h"
#include "nvs_flash.h"
#include "wifi_connect.h"

static const char *TAG = "main";

/* Global OTA queue handle — referenced by mqtt_transport.c */
QueueHandle_t g_ota_queue = NULL;

/* MQTT broker URI — update to your Mosquitto instance */
#define MQTT_BROKER_URI "mqtts://broker.local:8883"

/* Forward declaration from mqtt_transport.c */
void mqtt_transport_start(const char *broker_uri);

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

    /* ── Queues ──────────────────────────────────────────────────────── */
    ecu_init_can_queue();
    g_ota_queue = ota_init_queue();

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
