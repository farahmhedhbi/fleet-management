package com.example.fleet_backend.service;

import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.repository.VehicleRepository;
import com.example.fleet_backend.security.AuthUtil;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class VehicleAccessService {

    private final VehicleRepository vehicleRepository;

    public VehicleAccessService(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    public Vehicle getAuthorizedVehicle(Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + vehicleId));

        checkVehicleAccess(vehicle);
        return vehicle;
    }
    public void assertCanAccessVehicle(Long vehicleId) {
        if (vehicleId == null) {
            throw new RuntimeException("Vehicle id obligatoire");
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (AuthUtil.isAdmin(auth)) {
            return;
        }

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Véhicule introuvable"));

        Long currentUserId = AuthUtil.userId(auth);

        if (AuthUtil.isOwner(auth)
                && vehicle.getOwner() != null
                && vehicle.getOwner().getId().equals(currentUserId)) {
            return;
        }

        throw new RuntimeException("Accès refusé au véhicule");
    }

    public void checkVehicleAccess(Vehicle vehicle) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Unauthorized access");
        }

        if (AuthUtil.isAdmin(auth)) {
            return;
        }

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