package com.example.fleet_backend.service;

import com.example.fleet_backend.model.*;
import com.example.fleet_backend.repository.VehicleEventRepository;
import com.example.fleet_backend.repository.VehicleLiveStateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ObdResolutionService {

    private final VehicleLiveStateRepository vehicleLiveStateRepository;
    private final VehicleEventRepository vehicleEventRepository;

    public ObdResolutionService(
            VehicleLiveStateRepository vehicleLiveStateRepository,
            VehicleEventRepository vehicleEventRepository
    ) {
        this.vehicleLiveStateRepository = vehicleLiveStateRepository;
        this.vehicleEventRepository = vehicleEventRepository;
    }

    @Transactional
    public void resolveAfterMaintenanceDone(Maintenance maintenance) {
        if (maintenance == null || maintenance.getVehicle() == null) {
            return;
        }

        Incident incident = maintenance.getIncident();

        if (incident == null || incident.getVehicleEvent() == null) {
            return;
        }

        Vehicle vehicle = maintenance.getVehicle();
        VehicleEvent event = incident.getVehicleEvent();

        resolveEvent(event);
        resolveSimilarActiveEvents(vehicle.getId(), event.getEventType());
        repairLiveState(vehicle.getId(), event.getEventType());
    }

    @Transactional
    public void confirmFuelRefilled(Long vehicleId) {
        repairLiveState(vehicleId, VehicleEventType.OBD_LOW_FUEL);
        resolveSimilarActiveEvents(vehicleId, VehicleEventType.OBD_LOW_FUEL);
    }

    private void resolveEvent(VehicleEvent event) {
        if (event == null) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();

        event.setAcknowledged(true);
        event.setStatus(VehicleEventStatus.RESOLVED);
        event.setAcknowledgedAt(now);
        event.setResolvedAt(now);
    }

    private void resolveSimilarActiveEvents(Long vehicleId, VehicleEventType type) {
        if (vehicleId == null || type == null) {
            return;
        }

        List<VehicleEvent> activeEvents =
                vehicleEventRepository.findByVehicleIdAndEventTypeAndStatusOrderByCreatedAtDesc(
                        vehicleId,
                        type,
                        VehicleEventStatus.ACTIVE
                );

        LocalDateTime now = LocalDateTime.now();

        for (VehicleEvent event : activeEvents) {
            event.setAcknowledged(true);
            event.setStatus(VehicleEventStatus.RESOLVED);
            event.setAcknowledgedAt(now);
            event.setResolvedAt(now);
        }
    }

    private void repairLiveState(Long vehicleId, VehicleEventType type) {
        if (vehicleId == null || type == null) {
            return;
        }

        vehicleLiveStateRepository.findByVehicleId(vehicleId).ifPresent(liveState -> {

            switch (type) {
                case OBD_LOW_FUEL -> {
                    liveState.setFuelLevel(60.0);
                    liveState.setCheckEngineOn(false);
                }

                case OBD_HIGH_TEMP -> {
                    liveState.setEngineTemperature(85.0);
                    liveState.setCheckEngineOn(false);
                }

                case OBD_LOW_BATTERY -> {
                    liveState.setBatteryVoltage(12.6);
                    liveState.setCheckEngineOn(false);
                }

                case OBD_CHECK_ENGINE, ENGINE_FAILURE, MISSION_INTERRUPTED -> {
                    liveState.setCheckEngineOn(false);
                    liveState.setEngineTemperature(85.0);
                    liveState.setBatteryVoltage(12.6);
                }

                default -> {
                }
            }

            liveState.setHealthState(VehicleHealthState.NORMAL);
            liveState.setHealthReason("Problème OBD résolu après intervention");
            liveState.setLastTimestamp(LocalDateTime.now());
        });
    }
}