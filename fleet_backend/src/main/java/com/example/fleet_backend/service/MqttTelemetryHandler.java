package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.GpsDataRequest;
import com.example.fleet_backend.dto.TelemetryMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageHandler;
import org.springframework.stereotype.Service;

@Service
public class MqttTelemetryHandler implements MessageHandler {

    private final ObjectMapper objectMapper;
    private final GpsDataService gpsDataService;

    public MqttTelemetryHandler(ObjectMapper objectMapper, GpsDataService gpsDataService) {
        this.objectMapper = objectMapper;
        this.gpsDataService = gpsDataService;
    }

    @Override
    public void handleMessage(Message<?> message) {
        try {
            String payload = message.getPayload().toString();

            TelemetryMessage telemetry = objectMapper.readValue(payload, TelemetryMessage.class);

            GpsDataRequest request = new GpsDataRequest();
            request.setVehicleId(telemetry.getVehicleId());
            request.setLatitude(telemetry.getLatitude());
            request.setLongitude(telemetry.getLongitude());
            request.setSpeed(telemetry.getSpeed());
            request.setEngineOn(telemetry.getEngineOn());
            request.setTimestamp(telemetry.getTimestamp());

            gpsDataService.saveTelemetry(request);

            System.out.println("Telemetry saved for vehicle: " + telemetry.getVehicleId());

        } catch (Exception e) {
            System.err.println("MQTT processing error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}