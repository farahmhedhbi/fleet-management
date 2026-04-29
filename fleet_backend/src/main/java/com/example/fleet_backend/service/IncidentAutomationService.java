package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.IncidentDTO;
import com.example.fleet_backend.model.IncidentSeverity;
import com.example.fleet_backend.model.IncidentType;
import com.example.fleet_backend.model.VehicleEvent;
import com.example.fleet_backend.model.VehicleEventType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IncidentAutomationService {

    private final IncidentService incidentService;

    public IncidentAutomationService(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @Transactional
    public IncidentDTO createIncidentIfNeeded(VehicleEvent event) {
        if (event == null || event.getId() == null || event.getEventType() == null || event.getVehicle() == null) {
            return null;
        }

        Long vehicleId = event.getVehicle().getId();
        VehicleEventType type = event.getEventType();

        return switch (type) {
            case OBD_LOW_FUEL -> incidentService.createOrUpdateActiveSystemIncidentFromEvent(
                    event,
                    IncidentType.OBD_ALERT,
                    IncidentSeverity.MEDIUM,
                    "Incident technique véhicule",
                    "Niveau carburant faible",
                    "VEHICLE_" + vehicleId + "_TECHNICAL"
            );

            case OBD_HIGH_TEMP -> incidentService.createOrUpdateActiveSystemIncidentFromEvent(
                    event,
                    IncidentType.OBD_ALERT,
                    IncidentSeverity.CRITICAL,
                    "Incident technique véhicule",
                    "Température moteur critique",
                    "VEHICLE_" + vehicleId + "_TECHNICAL"
            );

            case OBD_LOW_BATTERY -> incidentService.createOrUpdateActiveSystemIncidentFromEvent(
                    event,
                    IncidentType.OBD_ALERT,
                    IncidentSeverity.HIGH,
                    "Incident technique véhicule",
                    "Batterie faible",
                    "VEHICLE_" + vehicleId + "_TECHNICAL"
            );

            case OBD_CHECK_ENGINE -> incidentService.createOrUpdateActiveSystemIncidentFromEvent(
                    event,
                    IncidentType.OBD_ALERT,
                    IncidentSeverity.CRITICAL,
                    "Incident technique véhicule",
                    "Voyant moteur activé",
                    "VEHICLE_" + vehicleId + "_TECHNICAL"
            );

            case ENGINE_FAILURE -> incidentService.createOrUpdateActiveSystemIncidentFromEvent(
                    event,
                    IncidentType.VEHICLE_BREAKDOWN,
                    IncidentSeverity.CRITICAL,
                    "Panne véhicule critique",
                    "Panne moteur probable détectée",
                    "VEHICLE_" + vehicleId + "_TECHNICAL"
            );

            case OVERSPEED -> incidentService.createOrUpdateActiveSystemIncidentFromEvent(
                    event,
                    IncidentType.DRIVER_BEHAVIOR,
                    IncidentSeverity.HIGH,
                    "Comportement conducteur à risque",
                    "Excès de vitesse détecté",
                    "VEHICLE_" + vehicleId + "_DRIVER_BEHAVIOR"
            );

            case OFF_ROUTE -> incidentService.createOrUpdateActiveSystemIncidentFromEvent(
                    event,
                    IncidentType.GPS_ANOMALY,
                    IncidentSeverity.HIGH,
                    "Problème de mission",
                    "Déviation de route détectée",
                    "VEHICLE_" + vehicleId + "_MISSION"
            );

            case STOP_LONG -> incidentService.createOrUpdateActiveSystemIncidentFromEvent(
                    event,
                    IncidentType.MISSION_PROBLEM,
                    IncidentSeverity.MEDIUM,
                    "Problème de mission",
                    "Arrêt prolongé détecté",
                    "VEHICLE_" + vehicleId + "_MISSION"
            );

            case MISSION_INTERRUPTED -> incidentService.createOrUpdateActiveSystemIncidentFromEvent(
                    event,
                    IncidentType.MISSION_PROBLEM,
                    IncidentSeverity.CRITICAL,
                    "Mission interrompue",
                    "Mission interrompue à cause d’un problème critique",
                    "VEHICLE_" + vehicleId + "_MISSION"
            );

            case NO_SIGNAL -> incidentService.createOrUpdateActiveSystemIncidentFromEvent(
                    event,
                    IncidentType.GPS_ANOMALY,
                    IncidentSeverity.MEDIUM,
                    "Problème GPS",
                    "Perte du signal GPS",
                    "VEHICLE_" + vehicleId + "_GPS"
            );

            default -> null;
        };
    }
}