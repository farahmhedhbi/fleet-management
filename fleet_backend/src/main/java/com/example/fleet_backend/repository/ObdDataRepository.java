package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.ObdData;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ObdDataRepository extends JpaRepository<ObdData, Long> {

    List<ObdData> findByVehicleIdOrderByTimestampAsc(Long vehicleId);

    List<ObdData> findByVehicleIdAndTimestampBetweenOrderByTimestampAsc(
            Long vehicleId,
            LocalDateTime from,
            LocalDateTime to
    );

    ObdData findTopByVehicleIdOrderByTimestampDesc(Long vehicleId);
}