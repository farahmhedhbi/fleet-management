package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.PredictiveAlert;
import com.example.fleet_backend.model.PredictiveAlertType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PredictiveAlertRepository extends JpaRepository<PredictiveAlert, Long> {

    List<PredictiveAlert> findTop50ByOrderByCreatedAtDesc();

    List<PredictiveAlert> findByVehicleIdOrderByCreatedAtDesc(Long vehicleId);

    List<PredictiveAlert> findByResolvedFalseOrderByCreatedAtDesc();

    Optional<PredictiveAlert> findTopByVehicleIdAndTypeAndResolvedFalseOrderByCreatedAtDesc(
            Long vehicleId,
            PredictiveAlertType type
    );
}