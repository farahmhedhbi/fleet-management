package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.Maintenance;
import com.example.fleet_backend.model.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MaintenanceRepository extends JpaRepository<Maintenance, Long> {

    List<Maintenance> findTop50ByOrderByCreatedAtDesc();

    List<Maintenance> findByVehicleIdOrderByCreatedAtDesc(Long vehicleId);

    List<Maintenance> findByStatusOrderByCreatedAtDesc(MaintenanceStatus status);

    List<Maintenance> findByVehicleIdAndStatusOrderByCreatedAtDesc(
            Long vehicleId,
            MaintenanceStatus status
    );

    List<Maintenance> findByStatusAndPlannedDateBefore(
            MaintenanceStatus status,
            LocalDateTime date
    );

    List<Maintenance> findByStatusAndPlannedDateBetweenOrderByPlannedDateAsc(
            MaintenanceStatus status,
            LocalDateTime start,
            LocalDateTime end
    );

    boolean existsByIncidentId(Long incidentId);

    Optional<Maintenance> findFirstByIncidentIdOrderByCreatedAtDesc(Long incidentId);

    List<Maintenance> findByWorkOrderIdOrderByCreatedAtAsc(Long workOrderId);

    @Query("""
        SELECT COUNT(m) > 0
        FROM Maintenance m
        WHERE m.vehicle.id = :vehicleId
          AND m.status IN :statuses
    """)
    boolean hasActiveMaintenance(
            @Param("vehicleId") Long vehicleId,
            @Param("statuses") List<MaintenanceStatus> statuses
    );

    @Query("""
        SELECT COUNT(m) > 0
        FROM Maintenance m
        WHERE m.vehicle.id = :vehicleId
          AND m.status IN :statuses
          AND m.plannedDate IS NOT NULL
          AND :missionStart < COALESCE(m.maintenanceDate, m.plannedDate)
          AND :missionEnd > m.plannedDate
    """)
    boolean hasMaintenanceConflict(
            @Param("vehicleId") Long vehicleId,
            @Param("statuses") List<MaintenanceStatus> statuses,
            @Param("missionStart") LocalDateTime missionStart,
            @Param("missionEnd") LocalDateTime missionEnd
    );

    long countByStatusIn(List<MaintenanceStatus> statuses);

    boolean existsByVehicleIdAndStatusIn(Long vehicleId, List<MaintenanceStatus> statuses);
    Optional<Maintenance> findTopByVehicleIdOrderByCreatedAtDesc(Long vehicleId);

    boolean existsByVehicleIdAndStatus(Long vehicleId, MaintenanceStatus status);
}