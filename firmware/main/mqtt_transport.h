#ifndef MQTT_TRANSPORT_H
#define MQTT_TRANSPORT_H

#include <stdbool.h>

/**
 * mqtt_transport_start — initialize and start the MQTT client.
 */
void mqtt_transport_start(const char *broker_uri);

/**
 * mqtt_publish_status — publish OTA lifecycle status.
 */
void mqtt_publish_status(const char *campaign_id, const char *status, const char *error);

/**
 * mqtt_publish_heartbeat — publish ECU health JSON.
 */
void mqtt_publish_heartbeat(const char *json_ecu_states);

#endif // MQTT_TRANSPORT_H
