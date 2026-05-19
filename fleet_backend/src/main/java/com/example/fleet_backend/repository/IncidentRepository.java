package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.Incident;
import com.example.fleet_backend.model.IncidentSeverity;
import com.example.fleet_backend.model.IncidentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface IncidentRepository extends JpaRepository<Incident, Long> {

    List<Incident> findTop50ByOrderByCreatedAtDesc();

    List<Incident> findByVehicleIdOrderByCreatedAtDesc(Long vehicleId);

    List<Incident> findByMissionIdOrderByCreatedAtDesc(Long missionId);

    List<Incident> findByStatusOrderByCreatedAtDesc(IncidentStatus status);

    List<Incident> findByReportedByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Incident> findByVehicleEventId(Long vehicleEventId);

    boolean existsByVehicleEventId(Long vehicleEventId);
    boolean existsByVehicleIdAndStatusIn(Long vehicleId, List<IncidentStatus> statuses);
    List<Incident> findByVehicleIdAndCreatedAtAfterOrderByCreatedAtDesc(
            Long vehicleId,
            LocalDateTime createdAt
    );
    boolean existsByVehicleIdAndSeverityAndStatusIn(
            Long vehicleId,
            IncidentSeverity severity,
            List<IncidentStatus> statuses
    );
    long countByVehicleOwnerIdAndStatus(Long ownerId, IncidentStatus status);

    long countByVehicleOwnerIdAndSeverityAndStatusIn(
            Long ownerId,
            IncidentSeverity severity,
            List<IncidentStatus> statuses
    );

}