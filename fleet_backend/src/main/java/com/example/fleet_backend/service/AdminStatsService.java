package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.AdminStatsDTO;
import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.repository.DriverRepository;
import com.example.fleet_backend.repository.UserRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AdminStatsService {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;

    public AdminStatsService(UserRepository userRepository,
                             VehicleRepository vehicleRepository,
                             DriverRepository driverRepository) {
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
    }

    public AdminStatsDTO getStats() {
        AdminStatsDTO dto = new AdminStatsDTO();

        dto.ownersCount = userRepository.countByRole_Name("ROLE_OWNER");

        dto.vehiclesCount = vehicleRepository.count();

        dto.availableVehicles = vehicleRepository.countByStatus(Vehicle.VehicleStatus.AVAILABLE);

        dto.inServiceVehicles = vehicleRepository.countByStatusIn(List.of(
                Vehicle.VehicleStatus.IN_USE,
                Vehicle.VehicleStatus.UNDER_MAINTENANCE,
                Vehicle.VehicleStatus.RESERVED
        ));

        dto.outVehicles = vehicleRepository.countByStatusIn(List.of(
                Vehicle.VehicleStatus.OUT_OF_SERVICE
        ));

        dto.driversCount = driverRepository.count();

        dto.activeDrivers = driverRepository.countByStatus(Driver.DriverStatus.ACTIVE);

        dto.vehiclesNeedingMaintenance =
                vehicleRepository.countMaintenanceDueBefore(LocalDateTime.now().plusDays(7));

        Double sum = vehicleRepository.sumMileage();
        dto.totalMileage = (sum == null) ? 0 : sum;

        return dto;
    }
}