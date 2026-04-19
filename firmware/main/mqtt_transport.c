/**
 * mqtt_transport.c — MQTT client init, OTA command subscription, and status publishing.
 *
 * Subscribes to:   sdv/ota/command
 * Publishes on:    sdv/ota/status/<device_mac>
 *
 * On receiving an OTA command, this module:
 *  1. Parses the JSON payload using cJSON
 *  2. Validates that the device MAC is in the "targets" array
 *  3. Enqueues the parsed ota_cmd_t into the OTA queue for ota_handler.
 */

#include "ota_handler.h"

#include "cJSON.h"
#include "esp_log.h"
#include "esp_mac.h"
#include "mqtt_client.h"

#include <string.h>

static const char *TAG = "mqtt";

/* Forward-declare: ota_init_queue() is called before mqtt_transport_start() */
extern QueueHandle_t g_ota_queue; /* set by app_main after ota_init_queue() */

static esp_mqtt_client_handle_t s_client = NULL;
static char s_device_id[18]; /* "XX:XX:XX:XX:XX:XX\0" */

/* Forward declaration for helper */
static void auto_str_field(cJSON *obj, const char *key, char *dst, size_t dstlen);

/* ── Determine device-specific client ID from eFuse MAC ─────────────────── */

static void build_device_id(void) {
    uint8_t mac[6];
    esp_efuse_mac_get_default(mac);
    snprintf(s_device_id, sizeof(s_device_id), "%02X:%02X:%02X:%02X:%02X:%02X",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
}

/* ── JSON OTA command parser ─────────────────────────────────────────────── */

/**
 * Parse the raw MQTT payload into an ota_cmd_t.
 * Returns true if the message is valid and this device is in the targets list.
 */
static bool parse_ota_command(const char *json, int json_len, ota_cmd_t *out) {
    char *buf = strndup(json, json_len);
    if (!buf) return false;

    cJSON *root = cJSON_Parse(buf);
    free(buf);
    if (!root) {
        ESP_LOGE(TAG, "JSON parse failed");
        return false;
    }

    /* Check if this device is listed in targets */
    cJSON *targets = cJSON_GetObjectItemCaseSensitive(root, "targets");
    bool targeted = false;
    if (cJSON_IsArray(targets)) {
        cJSON *t = NULL;
        cJSON_ArrayForEach(t, targets) {
            if (cJSON_IsString(t) && strcmp(t->valuestring, s_device_id) == 0) {
                targeted = true;
                break;
            }
        }
    } else {
        /* No targets field: treat as broadcast */
        targeted = true;
    }

    if (!targeted) {
        ESP_LOGI(TAG, "OTA command not targeted at this device (%s), skipping", s_device_id);
        cJSON_Delete(root);
        return false;
    }

    /* Extract required fields */
    auto_str_field(root, "campaign_id",   out->campaign_id,   sizeof(out->campaign_id));
    auto_str_field(root, "version",       out->version,       sizeof(out->version));
    auto_str_field(root, "firmware_url",  out->firmware_url,  sizeof(out->firmware_url));
    auto_str_field(root, "firmware_hash", out->firmware_hash, sizeof(out->firmware_hash));
    auto_str_field(root, "signature_b64", out->signature_b64, sizeof(out->signature_b64));
    auto_str_field(root, "nonce",         out->nonce,         sizeof(out->nonce));
    auto_str_field(root, "issued_at",     out->issued_at,     sizeof(out->issued_at));

    cJSON *ttl = cJSON_GetObjectItemCaseSensitive(root, "ttl_seconds");
    out->ttl_seconds = cJSON_IsNumber(ttl) ? (int)ttl->valuedouble : 300;

    cJSON_Delete(root);

    /* Validate mandatory fields */
    if (out->firmware_url[0] == '\0' || out->firmware_hash[0] == '\0') {
        ESP_LOGE(TAG, "OTA command missing required fields");
        return false;
    }
    return true;
}

/* Helper: copy a string field from cJSON object */
static void auto_str_field(cJSON *obj, const char *key, char *dst, size_t dstlen) {
    cJSON *item = cJSON_GetObjectItemCaseSensitive(obj, key);
    if (cJSON_IsString(item) && item->valuestring) {
        strncpy(dst, item->valuestring, dstlen - 1);
        dst[dstlen - 1] = '\0';
    }
}

/* ── MQTT status publisher ───────────────────────────────────────────────── */

void mqtt_publish_status(const char *campaign_id, const char *status, const char *error) {
    if (!s_client) return;

    char topic[80];
    snprintf(topic, sizeof(topic), "sdv/ota/status/%s", s_device_id);

    char payload[256];
    if (error && error[0] != '\0') {
        snprintf(payload, sizeof(payload),
                 "{\"device_id\":\"%s\",\"campaign_id\":\"%s\",\"status\":\"%s\",\"error\":\"%s\"}",
                 s_device_id, campaign_id ? campaign_id : "", status, error);
    } else {
        snprintf(payload, sizeof(payload),
                 "{\"device_id\":\"%s\",\"campaign_id\":\"%s\",\"status\":\"%s\"}",
                 s_device_id, campaign_id ? campaign_id : "", status);
    }

    int msg_id = esp_mqtt_client_publish(s_client, topic, payload, 0, 1, 0);
    ESP_LOGI(TAG, "status published [%s]: %s (msg_id=%d)", s_device_id, status, msg_id);
}

void mqtt_publish_heartbeat(const char *json_ecu_states) {
    if (!s_client) return;

    char topic[80];
    snprintf(topic, sizeof(topic), "sdv/ecu/status/%s", s_device_id);

    char payload[512];
    snprintf(payload, sizeof(payload),
             "{\"device_id\":\"%s\",\"ecu_states\":%s}",
             s_device_id, json_ecu_states);

    esp_mqtt_client_publish(s_client, topic, payload, 0, 0, 0); // QoS-0 for heartbeats
}

/* ── MQTT event handler ─────────────────────────────────────────────────── */

static void mqtt_event_handler(void *arg, esp_event_base_t base, int32_t event_id, void *event_data) {
    esp_mqtt_event_handle_t event = event_data;
    switch (event_id) {
        case MQTT_EVENT_CONNECTED:
            ESP_LOGI(TAG, "connected to broker");
            esp_mqtt_client_subscribe(s_client, "sdv/ota/command", 1);
            
            char cmd_topic[80];
            snprintf(cmd_topic, sizeof(cmd_topic), "sdv/device/command/%s", s_device_id);
            esp_mqtt_client_subscribe(s_client, cmd_topic, 1);
            ESP_LOGI(TAG, "subscribed to %s", cmd_topic);

            mqtt_publish_status(NULL, "online", NULL);
            break;

        case MQTT_EVENT_DATA:
            ESP_LOGI(TAG, "incoming message on %.*s", event->topic_len, event->topic);
            if (strncmp(event->topic, "sdv/ota/command", event->topic_len) == 0) {
                ota_cmd_t cmd = {0};
                if (parse_ota_command(event->data, event->data_len, &cmd)) {
                    if (xQueueSend(g_ota_queue, &cmd, pdMS_TO_TICKS(100)) != pdTRUE) {
                        ESP_LOGW(TAG, "OTA queue full, command dropped");
                    }
                }
            } else if (strstr(event->topic, "/device/command/")) {
                /* Handle direct device commands: { "action": "reboot" | "rollback" } */
                char *buf = strndup(event->data, event->data_len);
                cJSON *root = cJSON_Parse(buf);
                free(buf);
                if (root) {
                    cJSON *act = cJSON_GetObjectItemCaseSensitive(root, "action");
                    if (cJSON_IsString(act)) {
                        if (strcmp(act->valuestring, "rollback") == 0) {
                            ota_rollback_and_reboot();
                        } else if (strcmp(act->valuestring, "reboot") == 0) {
                            ota_reboot();
                        }
                    }
                    cJSON_Delete(root);
                }
            }
            break;

        case MQTT_EVENT_DISCONNECTED:
            ESP_LOGW(TAG, "disconnected — will auto-reconnect");
            break;

        case MQTT_EVENT_ERROR:
            ESP_LOGE(TAG, "MQTT error");
            break;

        default:
            break;
    }
}

/* ── Public init ─────────────────────────────────────────────────────────── */

void mqtt_transport_start(const char *broker_uri) {
    build_device_id();
    ESP_LOGI(TAG, "device identity: %s", s_device_id);

    char client_id[36];
    snprintf(client_id, sizeof(client_id), "esp32-%s", s_device_id);

    esp_mqtt_client_config_t cfg = {
        .broker.address.uri      = broker_uri,
        .credentials.client_id   = client_id,
        .session.keepalive        = 30,
        .network.reconnect_timeout_ms = 5000,
    };
    s_client = esp_mqtt_client_init(&cfg);
    esp_mqtt_client_register_event(s_client, ESP_EVENT_ANY_ID, mqtt_event_handler, NULL);
    esp_mqtt_client_start(s_client);
}
