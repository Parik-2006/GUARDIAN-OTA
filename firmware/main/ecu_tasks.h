/**
 * ecu_tasks.h — Virtual ECU task declarations and CAN queue helpers.
 */
#pragma once
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include <stdbool.h>

/** ECU identifiers (used as CAN address) */
typedef enum {
    ECU_BRAKE        = 0,
    ECU_POWERTRAIN   = 1,
    ECU_SENSOR       = 2,
    ECU_INFOTAINMENT = 3,
} ecu_id_t;

/** Single simulated CAN frame */
typedef struct {
    ecu_id_t from;
    ecu_id_t to;
    char     data[64];
} can_msg_t;

/**
 * Initialise the inter-ECU CAN queue. Must be called once before any ECU task.
 * @return Handle to the FreeRTOS queue (also stored internally for ecu_send_can).
 */
QueueHandle_t ecu_init_can_queue(void);

/** Returns true if the brake ECU most recently signalled a SAFE state. */
bool ecu_is_safe_to_update(void);

/* Task entry points — pass to xTaskCreate */
void brake_ecu_task(void *arg);
void powertrain_ecu_task(void *arg);
void sensor_ecu_task(void *arg);
void infotainment_ecu_task(void *arg);
