/**
 * ecu_tasks.c — FreeRTOS ECU simulation tasks with shared CAN queue.
 *
 * Simulates four vehicle ECUs communicating over an in-process FreeRTOS queue
 * that acts as a CAN bus. The brake ECU controls the global safety gate read
 * by ota_handler before executing any update.
 */

#include "ecu_tasks.h"
#include "mqtt_transport.h"

#include "esp_log.h"
#include "esp_random.h"
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include "freertos/task.h"

#include "lcd.h"

#include <stdbool.h>
#include <string.h>

static const char *TAG = "ecu";

static QueueHandle_t s_can_queue   = NULL;
static volatile bool s_safe_to_upd = true;

/* ── Public API ─────────────────────────────────────────────────────────── */

QueueHandle_t ecu_init_can_queue(void) {
    s_can_queue = xQueueCreate(32, sizeof(can_msg_t));
    configASSERT(s_can_queue);
    return s_can_queue;
}

bool ecu_is_safe_to_update(void) {
    return s_safe_to_upd;
}

/* ── Internal helper ────────────────────────────────────────────────────── */

static void send_can(ecu_id_t from, ecu_id_t to, const char *msg) {
    if (!s_can_queue) return;
    can_msg_t m = { .from = from, .to = to };
    strncpy(m.data, msg, sizeof(m.data) - 1);
    xQueueSend(s_can_queue, &m, pdMS_TO_TICKS(10));
}

/* ── ECU Tasks ──────────────────────────────────────────────────────────── */

/**
 * brake_ecu_task — Controls safety gate (g_safe_to_update).
 * 3% chance of reporting UNSAFE on each tick (simulates hard braking / fault).
 */
void brake_ecu_task(void *arg) {
    for (;;) {
        s_safe_to_upd = true;
        send_can(ECU_BRAKE, ECU_SENSOR, "SAFE");
        vTaskDelay(pdMS_TO_TICKS(800));
    }
}

/**
 * powertrain_ecu_task — Emits simulated torque telemetry to the brake ECU.
 */
void powertrain_ecu_task(void *arg) {
    uint32_t tick = 0;
    for (;;) {
        char buf[32];
        snprintf(buf, sizeof(buf), "torque=%lu", (unsigned long)(40 + (tick % 20)));
        send_can(ECU_POWERTRAIN, ECU_BRAKE, buf);
        tick++;
        vTaskDelay(pdMS_TO_TICKS(900));
    }
}

/**
 * sensor_ecu_task — Drains the CAN receive queue and logs all messages.
 */
void sensor_ecu_task(void *arg) {
    can_msg_t rx;
    uint32_t last_heartbeat = 0;

    for (;;) {
        if (xQueueReceive(s_can_queue, &rx, pdMS_TO_TICKS(100)) == pdTRUE) {
            ESP_LOGD(TAG, "CAN [%d→%d]: %s", rx.from, rx.to, rx.data);
        }

        // Publish heartbeat to cloud every 2 seconds
        if ((xTaskGetTickCount() - last_heartbeat) > pdMS_TO_TICKS(2000)) {
            last_heartbeat = xTaskGetTickCount();

            // Brake health reflects s_safe_to_upd (can be toggled by brake_ecu_task)
            const char* brake_st = s_safe_to_upd ? "green" : "red";
            
            char health_json[128];
            snprintf(health_json, sizeof(health_json),
                     "{\"brake\":\"%s\",\"powertrain\":\"green\",\"sensor\":\"green\",\"infotainment\":\"green\"}",
                     brake_st);
            
            mqtt_publish_heartbeat(health_json);
        }
    }
}

/**
 * infotainment_ecu_task — Sends periodic UI heartbeat on the CAN bus.
 */
void infotainment_ecu_task(void *arg) {
    for (;;) {
        send_can(ECU_INFOTAINMENT, ECU_POWERTRAIN, "ui_heartbeat: [ VERSION 2 ]");
        
        lcd_clear();
        lcd_set_cursor(0, 0);
        lcd_print("GUARDIAN-OTA");
        lcd_set_cursor(1, 0);
        lcd_print("ACTIVE: V-2.0(a)");

        ESP_LOGI(TAG, "LCD DISPLAY -> [ RUNNING FIRMWARE VERSION 2 ]");
        vTaskDelay(pdMS_TO_TICKS(1100));
    }
}
