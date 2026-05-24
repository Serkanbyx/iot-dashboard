import type { IClientOptions } from "mqtt";
import config from "./env.js";

export interface MqttConfig {
  brokerUrl: string;
  options: IClientOptions;
  topicRoot: string;
}

function buildMqttConfig(): MqttConfig {
  const { MQTT_BROKER_URL, MQTT_USERNAME, MQTT_PASSWORD, MQTT_TOPIC_ROOT } = config;

  const randomSuffix = Math.random().toString(36).substring(2, 10);

  const options: IClientOptions = {
    clientId: `iot-server-${randomSuffix}`,
    clean: true,
    reconnectPeriod: 5000,
  };

  if (MQTT_USERNAME && MQTT_PASSWORD) {
    options.username = MQTT_USERNAME;
    options.password = MQTT_PASSWORD;
  }

  const isSecure = MQTT_BROKER_URL.startsWith("mqtts://") || MQTT_BROKER_URL.startsWith("wss://");
  if (isSecure) {
    options.protocolVersion = 4;
    options.rejectUnauthorized = true;
  }

  return {
    brokerUrl: MQTT_BROKER_URL,
    options,
    topicRoot: MQTT_TOPIC_ROOT,
  };
}

const mqttConfig: Readonly<MqttConfig> = Object.freeze(buildMqttConfig());

export default mqttConfig;
