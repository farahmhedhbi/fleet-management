package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.Maintenance;
import com.example.fleet_backend.model.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

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
}