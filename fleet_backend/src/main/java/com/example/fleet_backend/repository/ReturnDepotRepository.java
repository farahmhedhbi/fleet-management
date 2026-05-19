package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.ReturnDepotRequest;
import com.example.fleet_backend.model.ReturnDepotStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReturnDepotRepository extends JpaRepository<ReturnDepotRequest, Long> {

    Optional<ReturnDepotRequest> findTopByMissionIdOrderBySuggestedAtDesc(Long missionId);

    Optional<ReturnDepotRequest> findTopByVehicleIdAndStatusOrderBySuggestedAtDesc(
            Long vehicleId,
            ReturnDepotStatus status
    );
}