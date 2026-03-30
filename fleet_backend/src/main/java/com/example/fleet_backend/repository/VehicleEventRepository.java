package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.VehicleEvent;
import com.example.fleet_backend.model.VehicleEventType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VehicleEventRepository extends JpaRepository<VehicleEvent, Long> {

    List<VehicleEvent> findByVehicleIdOrderByCreatedAtDesc(Long vehicleId);

    List<VehicleEvent> findTop50ByOrderByCreatedAtDesc();

    Optional<VehicleEvent> findTopByVehicleIdAndEventTypeOrderByCreatedAtDesc(
            Long vehicleId,
            VehicleEventType eventType
    );
}