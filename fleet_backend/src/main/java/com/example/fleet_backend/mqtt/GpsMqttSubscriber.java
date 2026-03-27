package com.example.fleet_backend.mqtt;

import com.example.fleet_backend.dto.GpsIncomingDTO;
import com.example.fleet_backend.service.GpsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.annotation.PostConstruct;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class GpsMqttSubscriber {

    private final MqttClient mqttClient;
    private final GpsService gpsService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${mqtt.topic}")
    private String topic;

    public GpsMqttSubscriber(MqttClient mqttClient, GpsService gpsService) {
        this.mqttClient = mqttClient;
        this.gpsService = gpsService;
        objectMapper.registerModule(new JavaTimeModule());
    }

    @PostConstruct
    public void subscribe() throws Exception {
        mqttClient.subscribe(topic, (receivedTopic, message) -> {
            String payload = new String(message.getPayload());
            System.out.println("[MQTT RECEIVED] " + payload);

            try {
                GpsIncomingDTO dto = objectMapper.readValue(payload, GpsIncomingDTO.class);
                gpsService.processIncomingGps(dto);
            } catch (Exception e) {
                System.err.println("[MQTT ERROR] " + e.getMessage());
            }
        });
    }
}