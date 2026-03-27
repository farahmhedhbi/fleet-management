package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    long count();

    long countByStatus(Vehicle.VehicleStatus status);

    @Query("SELECT COUNT(v) FROM Vehicle v WHERE v.status IN :statuses")
    long countByStatusIn(@Param("statuses") List<Vehicle.VehicleStatus> statuses);

    @Query("""
        SELECT COUNT(v) FROM Vehicle v
        WHERE v.nextMaintenanceDate IS NOT NULL
          AND v.nextMaintenanceDate <= :limit
    """)
    long countMaintenanceDueBefore(@Param("limit") LocalDateTime limit);

    @Query("SELECT COALESCE(SUM(v.mileage),0) FROM Vehicle v")
    Double sumMileage();

    Optional<Vehicle> findByRegistrationNumber(String registrationNumber);

    Optional<Vehicle> findByVin(String vin);

    List<Vehicle> findByDriverId(Long driverId);

    List<Vehicle> findByStatus(Vehicle.VehicleStatus status);

    List<Vehicle> findByBrand(String brand);

    List<Vehicle> findByOwnerId(Long ownerId);

    long countByOwnerId(Long ownerId);

    Optional<Vehicle> findByIdAndOwnerId(Long id, Long ownerId);

    boolean existsByRegistrationNumber(String registrationNumber);

    boolean existsByVin(String vin);

    void deleteByOwnerId(Long ownerId);


}