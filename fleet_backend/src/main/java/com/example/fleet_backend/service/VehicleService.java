package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.VehicleDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.repository.DriverRepository;
import com.example.fleet_backend.repository.UserRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import com.example.fleet_backend.security.AuthUtil;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;

    public VehicleService(VehicleRepository vehicleRepository,
                          DriverRepository driverRepository,
                          UserRepository userRepository) {
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
        this.userRepository = userRepository;
    }

    // ✅ Liste filtrée selon le rôle (1 seul GET /api/vehicles)
    public List<VehicleDTO> getVehiclesForConnectedUser(Authentication auth) {

        if (AuthUtil.isAdmin(auth)) {
            return vehicleRepository.findAll().stream().map(VehicleDTO::new).collect(Collectors.toList());
        }

        if (AuthUtil.hasRole(auth, "OWNER")) {
            Long ownerId = AuthUtil.userId(auth);
            return vehicleRepository.findByOwnerId(ownerId).stream().map(VehicleDTO::new).collect(Collectors.toList());
        }

        if (AuthUtil.hasRole(auth, "DRIVER")) {
            String email = auth.getName();
            Driver driver = driverRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Driver not found for email: " + email));

            return vehicleRepository.findByDriverId(driver.getId()).stream().map(VehicleDTO::new).collect(Collectors.toList());
        }

        throw new AccessDeniedException("Forbidden");
    }

    // ✅ GET /api/vehicles/{id} sécurisé
    public VehicleDTO getVehicleByIdSecured(Long id, Authentication auth) {

        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));

        if (AuthUtil.isAdmin(auth)) return new VehicleDTO(v);

        if (AuthUtil.hasRole(auth, "OWNER")) {
            Long ownerId = AuthUtil.userId(auth);
            if (v.getOwner() == null || !v.getOwner().getId().equals(ownerId)) {
                throw new AccessDeniedException("Not your vehicle");
            }
            return new VehicleDTO(v);
        }

        if (AuthUtil.hasRole(auth, "DRIVER")) {
            String email = auth.getName();
            Driver driver = driverRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Driver not found for email: " + email));

            if (v.getDriver() == null || !v.getDriver().getId().equals(driver.getId())) {
                throw new AccessDeniedException("Vehicle not assigned to you");
            }
            return new VehicleDTO(v);
        }

        throw new AccessDeniedException("Forbidden");
    }

    // ✅ POST sécurisé
    public VehicleDTO createVehicleSecured(VehicleDTO dto, Authentication auth) {

        // OWNER/ADMIN seulement (déjà bloqué par @PreAuthorize mais on sécurise)
        if (!(AuthUtil.isAdmin(auth) || AuthUtil.hasRole(auth, "OWNER"))) {
            throw new AccessDeniedException("Forbidden");
        }

        if (vehicleRepository.existsByRegistrationNumber(dto.getRegistrationNumber())) {
            throw new IllegalArgumentException("Registration number already exists");
        }
        if (dto.getVin() != null && vehicleRepository.existsByVin(dto.getVin())) {
            throw new IllegalArgumentException("VIN already exists");
        }

        Vehicle v = new Vehicle();
        mapDtoToEntity(dto, v);

        // ✅ owner = user connecté (OWNER) ou (ADMIN -> owner = admin lui-même)
        Long ownerId = AuthUtil.userId(auth);
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Owner user not found: " + ownerId));
        v.setOwner(owner);

        if (dto.getDriverId() != null) {
            Driver d = driverRepository.findById(dto.getDriverId())
                    .orElseThrow(() -> new ResourceNotFoundException("Driver not found: " + dto.getDriverId()));
            v.setDriver(d);
        }

        return new VehicleDTO(vehicleRepository.save(v));
    }

    // ✅ PUT sécurisé
    public VehicleDTO updateVehicleSecured(Long id, VehicleDTO dto, Authentication auth) {

        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));

        if (!AuthUtil.isAdmin(auth)) {
            Long ownerId = AuthUtil.userId(auth);
            if (v.getOwner() == null || !v.getOwner().getId().equals(ownerId)) {
                throw new AccessDeniedException("Not your vehicle");
            }
        }

        // unicité registrationNumber
        if (dto.getRegistrationNumber() != null &&
                !dto.getRegistrationNumber().equals(v.getRegistrationNumber()) &&
                vehicleRepository.existsByRegistrationNumber(dto.getRegistrationNumber())) {
            throw new IllegalArgumentException("Registration number already exists");
        }

        mapDtoToEntity(dto, v);

        if (dto.getDriverId() != null) {
            Driver d = driverRepository.findById(dto.getDriverId())
                    .orElseThrow(() -> new ResourceNotFoundException("Driver not found: " + dto.getDriverId()));
            v.setDriver(d);
        } else {
            v.setDriver(null);
        }

        return new VehicleDTO(vehicleRepository.save(v));
    }

    // ✅ DELETE sécurisé
    public void deleteVehicleSecured(Long id, Authentication auth) {
        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));

        if (!AuthUtil.isAdmin(auth)) {
            Long ownerId = AuthUtil.userId(auth);
            if (v.getOwner() == null || !v.getOwner().getId().equals(ownerId)) {
                throw new AccessDeniedException("Not your vehicle");
            }
        }
        vehicleRepository.delete(v);
    }

    // ✅ assign driver sécurisé
    public VehicleDTO assignDriverToVehicleSecured(Long vehicleId, Long driverId, Authentication auth) {
        Vehicle v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + vehicleId));

        if (!AuthUtil.isAdmin(auth)) {
            Long ownerId = AuthUtil.userId(auth);
            if (v.getOwner() == null || !v.getOwner().getId().equals(ownerId)) {
                throw new AccessDeniedException("Not your vehicle");
            }
        }

        Driver d = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found: " + driverId));

        v.setDriver(d);
        return new VehicleDTO(vehicleRepository.save(v));
    }

    public VehicleDTO removeDriverFromVehicleSecured(Long vehicleId, Authentication auth) {
        Vehicle v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + vehicleId));

        if (!AuthUtil.isAdmin(auth)) {
            Long ownerId = AuthUtil.userId(auth);
            if (v.getOwner() == null || !v.getOwner().getId().equals(ownerId)) {
                throw new AccessDeniedException("Not your vehicle");
            }
        }

        v.setDriver(null);
        return new VehicleDTO(vehicleRepository.save(v));
    }

    private void mapDtoToEntity(VehicleDTO dto, Vehicle v) {
        v.setRegistrationNumber(dto.getRegistrationNumber());
        v.setBrand(dto.getBrand());
        v.setModel(dto.getModel());
        v.setYear(dto.getYear());
        v.setColor(dto.getColor());
        v.setVin(dto.getVin());
        v.setFuelType(dto.getFuelType());
        v.setTransmission(dto.getTransmission());
        v.setStatus(dto.getStatus());
        v.setMileage(dto.getMileage());
        v.setLastMaintenanceDate(dto.getLastMaintenanceDate());
        v.setNextMaintenanceDate(dto.getNextMaintenanceDate());
    }
}
