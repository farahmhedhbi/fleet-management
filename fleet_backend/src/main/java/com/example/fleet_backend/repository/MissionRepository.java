package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.Mission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MissionRepository extends JpaRepository<Mission, Long> {

    List<Mission> findByOwnerId(Long ownerId);

    List<Mission> findByDriverId(Long driverId);

    @Query("""
        SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END
        FROM Mission m
        WHERE m.vehicle.id = :vehicleId
          AND m.status NOT IN ('DONE', 'CANCELED')
          AND :startDate < m.endDate
          AND :endDate > m.startDate
    """)
    boolean existsVehicleOverlap(@Param("vehicleId") Long vehicleId,
                                 @Param("startDate") LocalDateTime startDate,
                                 @Param("endDate") LocalDateTime endDate);

    @Query("""
        SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END
        FROM Mission m
        WHERE m.driver.id = :driverId
          AND m.status NOT IN ('DONE', 'CANCELED')
          AND :startDate < m.endDate
          AND :endDate > m.startDate
    """)
    boolean existsDriverOverlap(@Param("driverId") Long driverId,
                                @Param("startDate") LocalDateTime startDate,
                                @Param("endDate") LocalDateTime endDate);

    List<Mission> findByStatusAndStartDateBefore(Mission.MissionStatus status, LocalDateTime now);
}