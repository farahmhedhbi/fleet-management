package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.ObdHistoryDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.GpsData;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.repository.GpsDataRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import com.example.fleet_backend.security.AuthUtil;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class ObdHistoryService {

    private final GpsDataRepository gpsDataRepository;
    private final VehicleRepository vehicleRepository;

    public ObdHistoryService(GpsDataRepository gpsDataRepository,
                             VehicleRepository vehicleRepository) {
        this.gpsDataRepository = gpsDataRepository;
        this.vehicleRepository = vehicleRepository;
    }

    public List<ObdHistoryDTO> getVehicleHistory(Long vehicleId, LocalDateTime from, LocalDateTime to) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + vehicleId));

        checkVehicleAccess(vehicle);

        List<GpsData> data;
        if (from != null && to != null) {
            data = gpsDataRepository.findByVehicleIdAndTimestampBetweenOrderByTimestampAsc(vehicleId, from, to);
        } else {
            data = gpsDataRepository.findByVehicleIdOrderByTimestampDesc(vehicleId)
                    .stream()
                    .sorted(Comparator.comparing(GpsData::getTimestamp))
                    .toList();
        }

        return data.stream()
                .filter(this::hasObdData)
                .map(this::toDTO)
                .toList();
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

    private void checkVehicleAccess(Vehicle vehicle) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Unauthorized access");
        }

        if (AuthUtil.isAdmin(auth)) return;

        if (AuthUtil.hasRole(auth, "OWNER")) {
            Long currentUserId = AuthUtil.userId(auth);

            if (currentUserId == null) {
                throw new AccessDeniedException("Unauthorized access");
            }

            if (vehicle.getOwner() == null || vehicle.getOwner().getId() == null) {
                throw new AccessDeniedException("Vehicle has no owner");
            }

            if (!vehicle.getOwner().getId().equals(currentUserId)) {
                throw new AccessDeniedException("You do not have access to this vehicle");
            }

            return;
        }

        throw new AccessDeniedException("Access denied");
    }
}