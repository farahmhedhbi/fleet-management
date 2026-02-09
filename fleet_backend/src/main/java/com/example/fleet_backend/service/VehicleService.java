package com.example.fleet_backend.service;


import com.example.fleet_backend.dto.VehicleDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.repository.DriverRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class VehicleService {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private DriverRepository driverRepository;

    // VehicleService.java (ajout)


    public List<VehicleDTO> getMyVehicles(Authentication auth) {
        String email = auth.getName();

        Driver driver = driverRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found for email: " + email));

        return vehicleRepository.findByDriverId(driver.getId())
                .stream()
                .map(VehicleDTO::new)
                .collect(Collectors.toList());
    }


    public List<VehicleDTO> getAllVehicles() {
        return vehicleRepository.findAll()
                .stream()
                .map(VehicleDTO::new)
                .collect(Collectors.toList());
    }

    public VehicleDTO getVehicleById(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));
        return new VehicleDTO(vehicle);
    }

    public VehicleDTO createVehicle(VehicleDTO vehicleDTO) {
        if (vehicleRepository.existsByRegistrationNumber(vehicleDTO.getRegistrationNumber())) {
            throw new IllegalArgumentException("Registration number already exists");
        }

        if (vehicleDTO.getVin() != null && vehicleRepository.existsByVin(vehicleDTO.getVin())) {
            throw new IllegalArgumentException("VIN already exists");
        }

        Vehicle vehicle = new Vehicle();
        vehicle.setRegistrationNumber(vehicleDTO.getRegistrationNumber());
        vehicle.setBrand(vehicleDTO.getBrand());
        vehicle.setModel(vehicleDTO.getModel());
        vehicle.setYear(vehicleDTO.getYear());
        vehicle.setColor(vehicleDTO.getColor());
        vehicle.setVin(vehicleDTO.getVin());
        vehicle.setFuelType(vehicleDTO.getFuelType());
        vehicle.setTransmission(vehicleDTO.getTransmission());
        vehicle.setStatus(vehicleDTO.getStatus());
        vehicle.setMileage(vehicleDTO.getMileage());
        vehicle.setLastMaintenanceDate(vehicleDTO.getLastMaintenanceDate());
        vehicle.setNextMaintenanceDate(vehicleDTO.getNextMaintenanceDate());

        if (vehicleDTO.getDriverId() != null) {
            Driver driver = driverRepository.findById(vehicleDTO.getDriverId())
                    .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + vehicleDTO.getDriverId()));
            vehicle.setDriver(driver);
        }

        Vehicle savedVehicle = vehicleRepository.save(vehicle);
        return new VehicleDTO(savedVehicle);
    }

    public VehicleDTO updateVehicle(Long id, VehicleDTO vehicleDTO) {
        Vehicle existingVehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));

        if (!existingVehicle.getRegistrationNumber().equals(vehicleDTO.getRegistrationNumber()) &&
                vehicleRepository.existsByRegistrationNumber(vehicleDTO.getRegistrationNumber())) {
            throw new IllegalArgumentException("Registration number already exists");
        }

        existingVehicle.setRegistrationNumber(vehicleDTO.getRegistrationNumber());
        existingVehicle.setBrand(vehicleDTO.getBrand());
        existingVehicle.setModel(vehicleDTO.getModel());
        existingVehicle.setYear(vehicleDTO.getYear());
        existingVehicle.setColor(vehicleDTO.getColor());
        existingVehicle.setVin(vehicleDTO.getVin());
        existingVehicle.setFuelType(vehicleDTO.getFuelType());
        existingVehicle.setTransmission(vehicleDTO.getTransmission());
        existingVehicle.setStatus(vehicleDTO.getStatus());
        existingVehicle.setMileage(vehicleDTO.getMileage());
        existingVehicle.setLastMaintenanceDate(vehicleDTO.getLastMaintenanceDate());
        existingVehicle.setNextMaintenanceDate(vehicleDTO.getNextMaintenanceDate());

        if (vehicleDTO.getDriverId() != null) {
            Driver driver = driverRepository.findById(vehicleDTO.getDriverId())
                    .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + vehicleDTO.getDriverId()));
            existingVehicle.setDriver(driver);
        } else {
            existingVehicle.setDriver(null);
        }

        Vehicle updatedVehicle = vehicleRepository.save(existingVehicle);
        return new VehicleDTO(updatedVehicle);
    }

    public void deleteVehicle(Long id) {
        if (!vehicleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Vehicle not found with id: " + id);
        }
        vehicleRepository.deleteById(id);
    }

    public VehicleDTO assignDriverToVehicle(Long vehicleId, Long driverId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + vehicleId));

        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + driverId));

        vehicle.setDriver(driver);
        Vehicle updatedVehicle = vehicleRepository.save(vehicle);
        return new VehicleDTO(updatedVehicle);
    }

    public VehicleDTO removeDriverFromVehicle(Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + vehicleId));

        vehicle.setDriver(null);
        Vehicle updatedVehicle = vehicleRepository.save(vehicle);
        return new VehicleDTO(updatedVehicle);
    }

    public List<VehicleDTO> getVehiclesByDriverId(Long driverId) {
        return vehicleRepository.findByDriverId(driverId)
                .stream()
                .map(VehicleDTO::new)
                .collect(Collectors.toList());
    }
}