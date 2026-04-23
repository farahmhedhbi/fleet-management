package com.example.fleet_backend.service.gps;

import com.example.fleet_backend.dto.GpsIncomingDTO;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class GpsValidationService {

    public void validateIncoming(GpsIncomingDTO dto) {
        if (dto == null) throw new IllegalArgumentException("GPS payload is required");
        if (dto.getVehicleId() == null) throw new IllegalArgumentException("vehicleId is required");
        if (dto.getLatitude() == null || dto.getLatitude() < -90 || dto.getLatitude() > 90) {
            throw new IllegalArgumentException("latitude invalid");
        }
        if (dto.getLongitude() == null || dto.getLongitude() < -180 || dto.getLongitude() > 180) {
            throw new IllegalArgumentException("longitude invalid");
        }
        if (dto.getSpeed() == null || dto.getSpeed() < 0) {
            throw new IllegalArgumentException("speed invalid");
        }

        if (dto.getRouteSource() != null
                && !dto.getRouteSource().equalsIgnoreCase("MISSION")
                && !dto.getRouteSource().equalsIgnoreCase("STATIC")) {
            throw new IllegalArgumentException("routeSource must be MISSION or STATIC");
        }

        if (dto.getTimestamp() != null) {
            LocalDateTime now = LocalDateTime.now();
            if (dto.getTimestamp().isAfter(now.plusMinutes(5))
                    || dto.getTimestamp().isBefore(now.minusDays(1))) {
                throw new IllegalArgumentException("timestamp invalid");
            }
        }

        if (dto.getEngineRpm() != null && dto.getEngineRpm() < 0) {
            throw new IllegalArgumentException("engineRpm invalid");
        }

        if (dto.getEngineRpm() != null && !dto.isEngineOn() && dto.getEngineRpm() > 0) {
            throw new IllegalArgumentException("engineRpm cannot be > 0 when engineOn is false");
        }

        if (dto.getFuelLevel() != null && (dto.getFuelLevel() < 0 || dto.getFuelLevel() > 100)) {
            throw new IllegalArgumentException("fuelLevel must be between 0 and 100");
        }

        if (dto.getEngineTemperature() != null &&
                (dto.getEngineTemperature() < -40 || dto.getEngineTemperature() > 180)) {
            throw new IllegalArgumentException("engineTemperature invalid");
        }

        if (dto.getBatteryVoltage() != null &&
                (dto.getBatteryVoltage() < 0 || dto.getBatteryVoltage() > 30)) {
            throw new IllegalArgumentException("batteryVoltage invalid");
        }

        if (dto.getEngineLoad() != null &&
                (dto.getEngineLoad() < 0 || dto.getEngineLoad() > 100)) {
            throw new IllegalArgumentException("engineLoad must be between 0 and 100");
        }
    }
}