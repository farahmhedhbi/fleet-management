package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.GpsData;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface GpsDataRepository extends JpaRepository<GpsData, Long> {

    Optional<GpsData> findTopByVehicleIdOrderByTimestampDesc(Long vehicleId);

    List<GpsData> findByVehicleIdOrderByTimestampDesc(Long vehicleId);

    List<GpsData> findByVehicleIdAndTimestampBetweenOrderByTimestampAsc(
            Long vehicleId,
            LocalDateTime from,
            LocalDateTime to
    );

    List<GpsData> findByVehicleIdAndTimestampBetweenOrderByTimestampDesc(
            Long vehicleId,
            LocalDateTime from,
            LocalDateTime to,
            Pageable pageable
    );
}
