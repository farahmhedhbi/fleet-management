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
        SELECT COUNT(m) > 0
        FROM Mission m
        WHERE m.vehicle.id = :vehicleId
          AND m.status NOT IN ('DONE','CANCELED')
          AND m.startDate < :endDate
          AND m.endDate > :startDate
    """)
    boolean existsVehicleOverlap(@Param("vehicleId") Long vehicleId,
                                 @Param("startDate") LocalDateTime startDate,
                                 @Param("endDate") LocalDateTime endDate);

    @Query("""
        SELECT COUNT(m) > 0
        FROM Mission m
        WHERE m.driver.id = :driverId
          AND m.status NOT IN ('DONE','CANCELED')
          AND m.startDate < :endDate
          AND m.endDate > :startDate
    """)
    boolean existsDriverOverlap(@Param("driverId") Long driverId,
                                @Param("startDate") LocalDateTime startDate,
                                @Param("endDate") LocalDateTime endDate);

    // ✅ for UPDATE: exclude current mission id
    @Query("""
        SELECT COUNT(m) > 0
        FROM Mission m
        WHERE m.vehicle.id = :vehicleId
          AND m.id <> :missionId
          AND m.status NOT IN ('DONE','CANCELED')
          AND m.startDate < :endDate
          AND m.endDate > :startDate
    """)
    boolean existsVehicleOverlapExcept(@Param("vehicleId") Long vehicleId,
                                       @Param("missionId") Long missionId,
                                       @Param("startDate") LocalDateTime startDate,
                                       @Param("endDate") LocalDateTime endDate);

    @Query("""
        SELECT COUNT(m) > 0
        FROM Mission m
        WHERE m.driver.id = :driverId
          AND m.id <> :missionId
          AND m.status NOT IN ('DONE','CANCELED')
          AND m.startDate < :endDate
          AND m.endDate > :startDate
    """)
    boolean existsDriverOverlapExcept(@Param("driverId") Long driverId,
                                      @Param("missionId") Long missionId,
                                      @Param("startDate") LocalDateTime startDate,
                                      @Param("endDate") LocalDateTime endDate);
}