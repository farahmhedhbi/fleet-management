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
        if (event == null || event.getId() == null || event.getEventType() == null) {
            return null;
        }

        VehicleEventType type = event.getEventType();

        return switch (type) {
            case OVERSPEED -> incidentService.createIncidentFromEvent(
                    event.getId(),
                    IncidentType.DRIVER_BEHAVIOR,
                    IncidentSeverity.HIGH,
                    "Excès de vitesse détecté",
                    "Le véhicule a dépassé la vitesse autorisée."
            );

            case OFF_ROUTE -> incidentService.createIncidentFromEvent(
                    event.getId(),
                    IncidentType.GPS_ANOMALY,
                    IncidentSeverity.HIGH,
                    "Déviation de route détectée",
                    "Le véhicule est sorti de l’itinéraire prévu."
            );

            case STOP_LONG -> incidentService.createIncidentFromEvent(
                    event.getId(),
                    IncidentType.MISSION_PROBLEM,
                    IncidentSeverity.MEDIUM,
                    "Arrêt prolongé détecté",
                    "Le véhicule est resté arrêté pendant une durée anormale en mission."
            );

            case NO_SIGNAL -> incidentService.createIncidentFromEvent(
                    event.getId(),
                    IncidentType.GPS_ANOMALY,
                    IncidentSeverity.MEDIUM,
                    "Perte du signal GPS",
                    "Le système ne reçoit plus de signal GPS récent."
            );

            case OBD_LOW_FUEL -> incidentService.createIncidentFromEvent(
                    event.getId(),
                    IncidentType.OBD_ALERT,
                    IncidentSeverity.MEDIUM,
                    "Niveau carburant faible",
                    "Le niveau de carburant du véhicule est faible."
            );

            case OBD_HIGH_TEMP -> incidentService.createIncidentFromEvent(
                    event.getId(),
                    IncidentType.OBD_ALERT,
                    IncidentSeverity.CRITICAL,
                    "Température moteur critique",
                    "La température moteur est anormalement élevée."
            );

            case OBD_LOW_BATTERY -> incidentService.createIncidentFromEvent(
                    event.getId(),
                    IncidentType.OBD_ALERT,
                    IncidentSeverity.HIGH,
                    "Batterie faible",
                    "La tension de batterie du véhicule est faible."
            );

            case OBD_CHECK_ENGINE -> incidentService.createIncidentFromEvent(
                    event.getId(),
                    IncidentType.OBD_ALERT,
                    IncidentSeverity.CRITICAL,
                    "Voyant moteur activé",
                    "Le voyant check engine est activé."
            );

            case ENGINE_FAILURE -> incidentService.createIncidentFromEvent(
                    event.getId(),
                    IncidentType.VEHICLE_BREAKDOWN,
                    IncidentSeverity.CRITICAL,
                    "Panne moteur détectée",
                    "Le système a détecté une panne moteur probable."
            );

            case MISSION_INTERRUPTED -> incidentService.createIncidentFromEvent(
                    event.getId(),
                    IncidentType.MISSION_PROBLEM,
                    IncidentSeverity.CRITICAL,
                    "Mission interrompue",
                    "La mission a été interrompue à cause d’un problème détecté."
            );

            default -> null;
        };
    }
}