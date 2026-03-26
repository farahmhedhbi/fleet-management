package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.GpsDataRequest;
import com.example.fleet_backend.dto.GpsDataResponse;
import com.example.fleet_backend.model.GpsData;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.repository.GpsDataRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class GpsDataService {

    private final GpsDataRepository gpsDataRepository;
    private final VehicleRepository vehicleRepository;

    public GpsDataService(GpsDataRepository gpsDataRepository, VehicleRepository vehicleRepository) {
        this.gpsDataRepository = gpsDataRepository;
        this.vehicleRepository = vehicleRepository;
    }

    public void saveTelemetry(GpsDataRequest request) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + request.getVehicleId()));

        LocalDateTime timestamp = request.getTimestamp() != null
                ? request.getTimestamp()
                : LocalDateTime.now();

        GpsData gpsData = new GpsData(
                request.getLatitude(),
                request.getLongitude(),
                request.getSpeed(),
                request.getEngineOn(),
                timestamp,
                vehicle
        );

        gpsDataRepository.save(gpsData);
    }

    @Transactional(readOnly = true)
    public GpsDataResponse getLastPosition(Long vehicleId) {
        GpsData gpsData = gpsDataRepository.findTopByVehicleIdOrderByTimestampDesc(vehicleId)
                .orElseThrow(() -> new RuntimeException("No GPS data found for vehicle id: " + vehicleId));

        return new GpsDataResponse(gpsData);
    }

    @Transactional(readOnly = true)
    public List<GpsDataResponse> getHistory(Long vehicleId) {
        return gpsDataRepository.findByVehicleIdOrderByTimestampDesc(vehicleId)
                .stream()
                .map(GpsDataResponse::new)
                .collect(Collectors.toList());
    }
}