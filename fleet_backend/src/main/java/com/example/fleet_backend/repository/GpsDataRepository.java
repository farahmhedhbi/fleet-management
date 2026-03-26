package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.GpsData;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GpsDataRepository extends JpaRepository<GpsData, Long> {

    List<GpsData> findByVehicleIdOrderByTimestampDesc(Long vehicleId);

    Optional<GpsData> findTopByVehicleIdOrderByTimestampDesc(Long vehicleId);
}