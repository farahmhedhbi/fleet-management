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
import com.example.fleet_backend.websocket.DashboardWebSocketPublisher;
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
    private final DashboardWebSocketPublisher dashboardWebSocketPublisher;

    public VehicleService(
            VehicleRepository vehicleRepository,
            DriverRepository driverRepository,
            UserRepository userRepository,
            DashboardWebSocketPublisher dashboardWebSocketPublisher
    ) {
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
        this.userRepository = userRepository;
        this.dashboardWebSocketPublisher = dashboardWebSocketPublisher;
    }

    public List<VehicleDTO> getVehiclesForConnectedUser(Authentication auth) {
        if (AuthUtil.isAdmin(auth)) {
            return vehicleRepository.findAll()
                    .stream()
                    .map(VehicleDTO::new)
                    .collect(Collectors.toList());
        }

        if (AuthUtil.hasRole(auth, "OWNER")) {
            Long ownerId = AuthUtil.userId(auth);

            return vehicleRepository.findByOwnerId(ownerId)
                    .stream()
                    .map(VehicleDTO::new)
                    .collect(Collectors.toList());
        }

        if (AuthUtil.hasRole(auth, "DRIVER")) {
            String email = auth.getName();

            Driver driver = driverRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Driver not found for email: " + email
                    ));

            return vehicleRepository.findByDriverId(driver.getId())
                    .stream()
                    .map(VehicleDTO::new)
                    .collect(Collectors.toList());
        }

        throw new AccessDeniedException("Forbidden");
    }

    public VehicleDTO getVehicleByIdSecured(Long id, Authentication auth) {
        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Vehicle not found with id: " + id
                ));

        if (AuthUtil.isAdmin(auth)) {
            return new VehicleDTO(v);
        }

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
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Driver not found for email: " + email
                    ));

            if (v.getDriver() == null || !v.getDriver().getId().equals(driver.getId())) {
                throw new AccessDeniedException("Vehicle not assigned to you");
            }

            return new VehicleDTO(v);
        }

        throw new AccessDeniedException("Forbidden");
    }

    public VehicleDTO createVehicleSecured(VehicleDTO dto, Authentication auth) {
        if (!(AuthUtil.isAdmin(auth) || AuthUtil.hasRole(auth, "OWNER"))) {
            throw new AccessDeniedException("Forbidden");
        }

        validateCreateInput(dto);

        if (vehicleRepository.existsByRegistrationNumber(dto.getRegistrationNumber())) {
            throw new IllegalArgumentException("Registration number already exists");
        }

        if (dto.getVin() != null && !dto.getVin().isBlank()
                && vehicleRepository.existsByVin(dto.getVin())) {
            throw new IllegalArgumentException("VIN already exists");
        }

        Vehicle v = new Vehicle();
        mapDtoToEntity(dto, v, true);

        Long ownerId = AuthUtil.userId(auth);

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Owner user not found: " + ownerId
                ));

        v.setOwner(owner);

        if (dto.getDriverId() != null) {
            Driver d = driverRepository.findById(dto.getDriverId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Driver not found: " + dto.getDriverId()
                    ));

            validateDriverBelongsToOwnerIfNeeded(auth, d, ownerId);
            v.setDriver(d);
        }

        Vehicle saved = vehicleRepository.save(v);

        publishDashboard(saved);

        return new VehicleDTO(saved);
    }

    public VehicleDTO updateVehicleSecured(Long id, VehicleDTO dto, Authentication auth) {
        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Vehicle not found with id: " + id
                ));

        Long ownerId = AuthUtil.userId(auth);

        if (!AuthUtil.isAdmin(auth)) {
            if (v.getOwner() == null || !v.getOwner().getId().equals(ownerId)) {
                throw new AccessDeniedException("Not your vehicle");
            }
        }

        if (dto.getRegistrationNumber() != null
                && !dto.getRegistrationNumber().equals(v.getRegistrationNumber())
                && vehicleRepository.existsByRegistrationNumber(dto.getRegistrationNumber())) {
            throw new IllegalArgumentException("Registration number already exists");
        }

        if (dto.getVin() != null
                && !dto.getVin().isBlank()
                && v.getVin() != null
                && !dto.getVin().equals(v.getVin())
                && vehicleRepository.existsByVin(dto.getVin())) {
            throw new IllegalArgumentException("VIN already exists");
        }

        mapDtoToEntity(dto, v, false);

        if (dto.getDriverId() != null) {
            Driver d = driverRepository.findById(dto.getDriverId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Driver not found: " + dto.getDriverId()
                    ));

            validateDriverBelongsToOwnerIfNeeded(auth, d, ownerId);
            v.setDriver(d);
        } else {
            v.setDriver(null);
        }

        Vehicle saved = vehicleRepository.save(v);

        publishDashboard(saved);

        return new VehicleDTO(saved);
    }

    public void deleteVehicleSecured(Long id, Authentication auth) {
        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Vehicle not found with id: " + id
                ));

        Long ownerId = v.getOwner() != null ? v.getOwner().getId() : null;

        if (!AuthUtil.isAdmin(auth)) {
            Long currentOwnerId = AuthUtil.userId(auth);

            if (v.getOwner() == null || !v.getOwner().getId().equals(currentOwnerId)) {
                throw new AccessDeniedException("Not your vehicle");
            }
        }

        vehicleRepository.delete(v);

        publishDashboard(ownerId);
    }

    public VehicleDTO removeDriverFromVehicleSecured(Long vehicleId, Authentication auth) {
        Vehicle v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Vehicle not found: " + vehicleId
                ));

        if (!AuthUtil.isAdmin(auth)) {
            Long ownerId = AuthUtil.userId(auth);

            if (v.getOwner() == null || !v.getOwner().getId().equals(ownerId)) {
                throw new AccessDeniedException("Not your vehicle");
            }
        }

        v.setDriver(null);

        Vehicle saved = vehicleRepository.save(v);

        publishDashboard(saved);

        return new VehicleDTO(saved);
    }

    @Transactional
    public Vehicle unassignDriver(Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        vehicle.setDriver(null);

        Vehicle saved = vehicleRepository.save(vehicle);

        publishDashboard(saved);

        return saved;
    }

    private void publishDashboard(Vehicle vehicle) {
        if (vehicle != null && vehicle.getOwner() != null) {
            dashboardWebSocketPublisher.publishOwnerKpi(vehicle.getOwner().getId());
        }
    }

    private void publishDashboard(Long ownerId) {
        if (ownerId != null) {
            dashboardWebSocketPublisher.publishOwnerKpi(ownerId);
        }
    }

    private void mapDtoToEntity(VehicleDTO dto, Vehicle v, boolean createMode) {
        if (dto.getRegistrationNumber() != null) {
            v.setRegistrationNumber(dto.getRegistrationNumber().trim());
        }

        if (dto.getBrand() != null) {
            v.setBrand(dto.getBrand().trim());
        }

        if (dto.getModel() != null) {
            v.setModel(dto.getModel().trim());
        }

        if (dto.getYear() != null) {
            v.setYear(dto.getYear());
        }

        v.setColor(dto.getColor());
        v.setVin(dto.getVin());
        v.setFuelType(dto.getFuelType());
        v.setTransmission(dto.getTransmission());

        if (dto.getStatus() != null) {
            v.setStatus(dto.getStatus());
        } else if (createMode) {
            v.setStatus(Vehicle.VehicleStatus.AVAILABLE);
        }

        v.setMileage(dto.getMileage());
        v.setLastMaintenanceDate(dto.getLastMaintenanceDate());
        v.setNextMaintenanceDate(dto.getNextMaintenanceDate());

        v.setCurrentLatitude(dto.getCurrentLatitude());
        v.setCurrentLongitude(dto.getCurrentLongitude());
        v.setCurrentCity(dto.getCurrentCity());

        v.setHomeDepotCity(dto.getHomeDepotCity());
        v.setHomeDepotLatitude(dto.getHomeDepotLatitude());
        v.setHomeDepotLongitude(dto.getHomeDepotLongitude());

        if (createMode) {
            initializeCurrentLocationFromDepotIfMissing(v);
        }
    }

    private void initializeCurrentLocationFromDepotIfMissing(Vehicle vehicle) {
        if (vehicle.getCurrentLatitude() == null && vehicle.getHomeDepotLatitude() != null) {
            vehicle.setCurrentLatitude(vehicle.getHomeDepotLatitude());
        }

        if (vehicle.getCurrentLongitude() == null && vehicle.getHomeDepotLongitude() != null) {
            vehicle.setCurrentLongitude(vehicle.getHomeDepotLongitude());
        }

        if ((vehicle.getCurrentCity() == null || vehicle.getCurrentCity().isBlank())
                && vehicle.getHomeDepotCity() != null) {
            vehicle.setCurrentCity(vehicle.getHomeDepotCity());
        }
    }

    private void validateCreateInput(VehicleDTO dto) {
        if (dto == null) {
            throw new IllegalArgumentException("Vehicle data is required");
        }

        if (dto.getRegistrationNumber() == null || dto.getRegistrationNumber().isBlank()) {
            throw new IllegalArgumentException("Registration number is required");
        }

        if (dto.getBrand() == null || dto.getBrand().isBlank()) {
            throw new IllegalArgumentException("Brand is required");
        }

        if (dto.getModel() == null || dto.getModel().isBlank()) {
            throw new IllegalArgumentException("Model is required");
        }

        if (dto.getYear() == null) {
            throw new IllegalArgumentException("Year is required");
        }
    }

    private void validateDriverBelongsToOwnerIfNeeded(
            Authentication auth,
            Driver driver,
            Long ownerId
    ) {
        if (AuthUtil.isAdmin(auth)) {
            return;
        }

        if (driver.getOwner() == null || !driver.getOwner().getId().equals(ownerId)) {
            throw new AccessDeniedException("You can only assign your own drivers");
        }
    }
}