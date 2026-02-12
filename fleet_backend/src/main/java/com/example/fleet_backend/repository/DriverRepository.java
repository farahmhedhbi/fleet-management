package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {

    Optional<Driver> findByEmail(String email);

    Optional<Driver> findByLicenseNumber(String licenseNumber);

    List<Driver> findByStatus(Driver.DriverStatus status);

    boolean existsByEmail(String email);

    boolean existsByLicenseNumber(String licenseNumber);

}