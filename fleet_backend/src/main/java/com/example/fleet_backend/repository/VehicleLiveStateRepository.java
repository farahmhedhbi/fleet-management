package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.VehicleLiveState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VehicleLiveStateRepository extends JpaRepository<VehicleLiveState, Long> {
    Optional<VehicleLiveState> findByVehicleId(Long vehicleId);
}