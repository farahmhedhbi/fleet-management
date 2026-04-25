package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.ObdHistoryDTO;
import com.example.fleet_backend.model.GpsData;
import com.example.fleet_backend.repository.GpsDataRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class ObdHistoryService {

    private final GpsDataRepository gpsDataRepository;
    private final VehicleAccessService vehicleAccessService;

    public ObdHistoryService(GpsDataRepository gpsDataRepository,
                             VehicleAccessService vehicleAccessService) {
        this.gpsDataRepository = gpsDataRepository;
        this.vehicleAccessService = vehicleAccessService;
    }

    @Transactional(readOnly = true)
    public List<ObdHistoryDTO> getVehicleHistory(Long vehicleId, LocalDateTime from, LocalDateTime to) {
        vehicleAccessService.getAuthorizedVehicle(vehicleId);

        List<GpsData> data = gpsDataRepository.findByVehicleIdOrderByTimestampDesc(vehicleId)
                .stream()
                .filter(this::hasObdData)
                .filter(gps -> isInsideRange(gps, from, to))
                .sorted(Comparator.comparing(GpsData::getTimestamp))
                .toList();

        return data.stream()
                .map(this::toDTO)
                .toList();
    }

    private boolean isInsideRange(GpsData gps, LocalDateTime from, LocalDateTime to) {
        if (gps.getTimestamp() == null) return false;

        if (from != null && gps.getTimestamp().isBefore(from)) {
            return false;
        }

        if (to != null && gps.getTimestamp().isAfter(to)) {
            return false;
        }

        return true;
    }

    private boolean hasObdData(GpsData gps) {
        return gps.getEngineRpm() != null
                || gps.getFuelLevel() != null
                || gps.getEngineTemperature() != null
                || gps.getBatteryVoltage() != null
                || gps.getEngineLoad() != null
                || gps.getCheckEngineOn() != null;
    }

    private ObdHistoryDTO toDTO(GpsData gps) {
        return new ObdHistoryDTO(
                gps.getId(),
                gps.getVehicle().getId(),
                gps.getEngineRpm(),
                gps.getFuelLevel(),
                gps.getEngineTemperature(),
                gps.getBatteryVoltage(),
                gps.getEngineLoad(),
                gps.getCheckEngineOn(),
                gps.getTimestamp()
        );
    }
}