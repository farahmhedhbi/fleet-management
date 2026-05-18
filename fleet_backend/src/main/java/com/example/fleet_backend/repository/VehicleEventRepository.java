package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.VehicleEvent;
import com.example.fleet_backend.model.VehicleEventStatus;
import com.example.fleet_backend.model.VehicleEventType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface VehicleEventRepository extends JpaRepository<VehicleEvent, Long> {

    List<VehicleEvent> findByVehicleIdOrderByCreatedAtDesc(Long vehicleId);

    List<VehicleEvent> findTop50ByOrderByCreatedAtDesc();

    Optional<VehicleEvent> findTopByVehicleIdAndEventTypeOrderByCreatedAtDesc(
            Long vehicleId,
            VehicleEventType eventType
    );

    Optional<VehicleEvent> findTopByVehicleIdAndMissionIdAndEventTypeOrderByCreatedAtDesc(
            Long vehicleId,
            Long missionId,
            VehicleEventType eventType
    );

    Optional<VehicleEvent> findTopByVehicleIdAndMissionIdIsNullAndEventTypeOrderByCreatedAtDesc(
            Long vehicleId,
            VehicleEventType eventType
    );

    List<VehicleEvent> findByVehicleIdAndCreatedAtAfterOrderByCreatedAtDesc(
            Long vehicleId,
            LocalDateTime createdAt
    );

    List<VehicleEvent> findByVehicleIdAndStatusOrderByCreatedAtDesc(
            Long vehicleId,
            VehicleEventStatus status
    );

    List<VehicleEvent> findByVehicleIdAndEventTypeAndStatusOrderByCreatedAtDesc(
            Long vehicleId,
            VehicleEventType eventType,
            VehicleEventStatus status
    );
}