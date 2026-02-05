package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    Optional<Vehicle> findByRegistrationNumber(String registrationNumber);

    Optional<Vehicle> findByVin(String vin);

    List<Vehicle> findByDriverId(Long driverId);

    List<Vehicle> findByStatus(Vehicle.VehicleStatus status);

    List<Vehicle> findByBrand(String brand);

    boolean existsByRegistrationNumber(String registrationNumber);

    boolean existsByVin(String vin);
}