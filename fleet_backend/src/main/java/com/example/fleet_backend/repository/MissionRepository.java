package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MissionRepository extends JpaRepository<Mission, Long> {

    List<Mission> findByOwner_Id(Long ownerId);
    List<Mission> findByDriver_Id(Long driverId);
    List<Mission> findByVehicle_Id(Long vehicleId);

    List<Mission> findByStatusAndStartDateBefore(Mission.MissionStatus status, LocalDateTime now);

    Optional<Mission> findFirstByVehicleIdAndStatus(Long vehicleId, Mission.MissionStatus status);

    Optional<Mission> findFirstByVehicleAndStatusOrderByCreatedAtDesc(
            Vehicle vehicle,
            Mission.MissionStatus status
    );

    boolean existsByVehicleAndStatusIn(Vehicle vehicle, List<Mission.MissionStatus> statuses);
    boolean existsByDriverAndStatusIn(Driver driver, List<Mission.MissionStatus> statuses);
    boolean existsByOwner(User owner);

    boolean existsByVehicleIdAndStatus(Long vehicleId, Mission.MissionStatus status);
    boolean existsByDriverIdAndStatus(Long driverId, Mission.MissionStatus status);

    @Query("""
        SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END
        FROM Mission m
        WHERE m.vehicle.id = :vehicleId
          AND m.status NOT IN ('COMPLETED', 'CANCELED')
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
          AND m.status NOT IN ('COMPLETED', 'CANCELED')
          AND :startDate < m.endDate
          AND :endDate > m.startDate
    """)
    boolean existsDriverOverlap(@Param("driverId") Long driverId,
                                @Param("startDate") LocalDateTime startDate,
                                @Param("endDate") LocalDateTime endDate);

    @Query("""
        SELECT COUNT(m) > 0
        FROM Mission m
        WHERE m.vehicle.id = :vehicleId
          AND m.id <> :missionId
          AND m.status <> com.example.fleet_backend.model.Mission$MissionStatus.CANCELED
          AND :startDate < m.endDate
          AND :endDate > m.startDate
    """)
    boolean existsVehicleOverlapExcludingMission(
            @Param("vehicleId") Long vehicleId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("missionId") Long missionId
    );

    @Query("""
        SELECT COUNT(m) > 0
        FROM Mission m
        WHERE m.driver.id = :driverId
          AND m.id <> :missionId
          AND m.status <> com.example.fleet_backend.model.Mission$MissionStatus.CANCELED
          AND :startDate < m.endDate
          AND :endDate > m.startDate
    """)
    boolean existsDriverOverlapExcludingMission(
            @Param("driverId") Long driverId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("missionId") Long missionId
    );

    Optional<Mission> findFirstByVehicleIdAndStatusOrderByStartDateDesc(
            Long vehicleId,
            Mission.MissionStatus status
    );
}