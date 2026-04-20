package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.ObdHistoryDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.ObdData;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.repository.ObdDataRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import com.example.fleet_backend.security.AuthUtil;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ObdHistoryService {

    private final ObdDataRepository obdDataRepository;
    private final VehicleRepository vehicleRepository;

    public ObdHistoryService(
            ObdDataRepository obdDataRepository,
            VehicleRepository vehicleRepository
    ) {
        this.obdDataRepository = obdDataRepository;
        this.vehicleRepository = vehicleRepository;
    }

    public List<ObdHistoryDTO> getVehicleHistory(Long vehicleId, LocalDateTime from, LocalDateTime to) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + vehicleId));

        checkVehicleAccess(vehicle);

        List<ObdData> data;

        if (from != null && to != null) {
            data = obdDataRepository.findByVehicleIdAndTimestampBetweenOrderByTimestampAsc(vehicleId, from, to);
        } else {
            data = obdDataRepository.findByVehicleIdOrderByTimestampAsc(vehicleId);
        }

        return data.stream()
                .map(this::toDTO)
                .toList();
    }

    private ObdHistoryDTO toDTO(ObdData obd) {
        return new ObdHistoryDTO(
                obd.getId(),
                obd.getVehicle().getId(),
                obd.getEngineRpm(),
                obd.getFuelLevel(),
                obd.getEngineTemperature(),
                obd.getBatteryVoltage(),
                obd.getEngineLoad(),
                obd.getCheckEngine(),
                obd.getTimestamp()
        );
    }

    private void checkVehicleAccess(Vehicle vehicle) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Unauthorized access");
        }

        if (AuthUtil.isAdmin(auth)) {
            return;
        }

        if (AuthUtil.isOwner(auth)) {
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