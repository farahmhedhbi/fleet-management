package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.VehicleObdLiveDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.model.VehicleLiveState;
import com.example.fleet_backend.repository.VehicleLiveStateRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import com.example.fleet_backend.security.AuthUtil;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class ObdLiveService {

    private final VehicleLiveStateRepository vehicleLiveStateRepository;
    private final VehicleRepository vehicleRepository;

    public ObdLiveService(VehicleLiveStateRepository vehicleLiveStateRepository,
                          VehicleRepository vehicleRepository) {
        this.vehicleLiveStateRepository = vehicleLiveStateRepository;
        this.vehicleRepository = vehicleRepository;
    }

    public VehicleObdLiveDTO getVehicleObdLive(Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + vehicleId));

        checkVehicleAccess(vehicle);

        VehicleLiveState liveState = vehicleLiveStateRepository.findByVehicleId(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Live OBD state not found for vehicle " + vehicleId));

        VehicleObdLiveDTO dto = new VehicleObdLiveDTO();
        dto.setVehicleId(vehicle.getId());
        dto.setRegistrationNumber(vehicle.getRegistrationNumber());
        dto.setEngineOn(liveState.isEngineOn());
        dto.setEngineRpm(liveState.getEngineRpm());
        dto.setFuelLevel(liveState.getFuelLevel());
        dto.setEngineTemperature(liveState.getEngineTemperature());
        dto.setBatteryVoltage(liveState.getBatteryVoltage());
        dto.setEngineLoad(liveState.getEngineLoad());
        dto.setCheckEngineOn(liveState.getCheckEngineOn());
        dto.setObdStatus(liveState.getObdStatus());
        dto.setTimestamp(liveState.getLastTimestamp());
        return dto;
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