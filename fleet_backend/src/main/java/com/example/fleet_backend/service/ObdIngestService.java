package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.ObdIngestRequest;
import com.example.fleet_backend.model.ObdData;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.repository.ObdDataRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class ObdIngestService {

    private final ObdDataRepository obdDataRepository;
    private final VehicleRepository vehicleRepository;

    public ObdIngestService(ObdDataRepository obdDataRepository,
                            VehicleRepository vehicleRepository) {
        this.obdDataRepository = obdDataRepository;
        this.vehicleRepository = vehicleRepository;
    }

    public void ingest(ObdIngestRequest request) {

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        ObdData data = new ObdData();

        data.setVehicle(vehicle);
        data.setEngineRpm(request.getEngineRpm());
        data.setFuelLevel(request.getFuelLevel());
        data.setEngineTemperature(request.getEngineTemperature());
        data.setBatteryVoltage(request.getBatteryVoltage());
        data.setEngineLoad(request.getEngineLoad());
        data.setCheckEngine(request.getCheckEngine());

        data.setTimestamp(LocalDateTime.now());

        obdDataRepository.save(data);

        System.out.println("OBD SAVED ✅");
    }
}
