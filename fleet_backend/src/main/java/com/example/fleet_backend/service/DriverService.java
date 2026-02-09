package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.DriverDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.repository.DriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DriverService {

    @Autowired
    private DriverRepository driverRepository;
    public DriverDTO getMyProfile(Authentication auth) {
        String email = auth.getName();
        Driver driver = driverRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found for email: " + email));
        return new DriverDTO(driver);
    }

    public List<DriverDTO> getAllDrivers() {
        return driverRepository.findAll()
                .stream()
                .map(DriverDTO::new)
                .collect(Collectors.toList());
    }

    public DriverDTO getDriverById(Long id) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + id));
        return new DriverDTO(driver);
    }

    public DriverDTO createDriver(DriverDTO driverDTO) {
        if (driverRepository.existsByEmail(driverDTO.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        if (driverRepository.existsByLicenseNumber(driverDTO.getLicenseNumber())) {
            throw new IllegalArgumentException("License number already exists");
        }

        Driver driver = new Driver();
        driver.setFirstName(driverDTO.getFirstName());
        driver.setLastName(driverDTO.getLastName());
        driver.setEmail(driverDTO.getEmail());
        driver.setPhone(driverDTO.getPhone());
        driver.setLicenseNumber(driverDTO.getLicenseNumber());
        driver.setLicenseExpiry(driverDTO.getLicenseExpiry());
        driver.setEcoScore(driverDTO.getEcoScore());
        driver.setStatus(driverDTO.getStatus());

        Driver savedDriver = driverRepository.save(driver);
        return new DriverDTO(savedDriver);
    }

    public DriverDTO updateDriver(Long id, DriverDTO driverDTO) {
        Driver existingDriver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + id));

        if (!existingDriver.getEmail().equals(driverDTO.getEmail()) &&
                driverRepository.existsByEmail(driverDTO.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        existingDriver.setFirstName(driverDTO.getFirstName());
        existingDriver.setLastName(driverDTO.getLastName());
        existingDriver.setEmail(driverDTO.getEmail());
        existingDriver.setPhone(driverDTO.getPhone());
        existingDriver.setLicenseNumber(driverDTO.getLicenseNumber());
        existingDriver.setLicenseExpiry(driverDTO.getLicenseExpiry());
        existingDriver.setEcoScore(driverDTO.getEcoScore());
        existingDriver.setStatus(driverDTO.getStatus());

        Driver updatedDriver = driverRepository.save(existingDriver);
        return new DriverDTO(updatedDriver);
    }

    public void deleteDriver(Long id) {
        if (!driverRepository.existsById(id)) {
            throw new ResourceNotFoundException("Driver not found with id: " + id);
        }
        driverRepository.deleteById(id);
    }
}