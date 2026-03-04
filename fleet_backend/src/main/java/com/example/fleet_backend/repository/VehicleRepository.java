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

    // JpaRepository a déjà count(), mais ok si tu la laisses
    long count();

    // ✅ FIX: enum
    long countByStatus(Vehicle.VehicleStatus status);

    // ✅ FIX: status IN (enum list)
    @Query("SELECT COUNT(v) FROM Vehicle v WHERE v.status IN :statuses")
    long countByStatusIn(@Param("statuses") List<Vehicle.VehicleStatus> statuses);

    // ✅ FIX: LocalDateTime (pas LocalDate)
    @Query("""
        SELECT COUNT(v) FROM Vehicle v
        WHERE v.nextMaintenanceDate IS NOT NULL
          AND v.nextMaintenanceDate <= :limit
    """)
    long countMaintenanceDueBefore(@Param("limit") LocalDateTime limit);

    // ✅ FIX: mileage = Double => SUM returns Double
    @Query("SELECT COALESCE(SUM(v.mileage),0) FROM Vehicle v")
    Double sumMileage();

    Optional<Vehicle> findByRegistrationNumber(String registrationNumber);

    Optional<Vehicle> findByVin(String vin);

    List<Vehicle> findByDriverId(Long driverId);

    List<Vehicle> findByStatus(Vehicle.VehicleStatus status);

    List<Vehicle> findByBrand(String brand);

    List<Vehicle> findByOwnerId(Long ownerId);

    Optional<Vehicle> findByIdAndOwnerId(Long id, Long ownerId);

    boolean existsByRegistrationNumber(String registrationNumber);

    boolean existsByVin(String vin);

    void deleteByOwnerId(Long ownerId);
}