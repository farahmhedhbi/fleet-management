package com.example.fleet_backend.service;

import com.example.fleet_backend.model.GpsData;
import com.example.fleet_backend.model.VehicleHealthState;
import org.springframework.stereotype.Service;

@Service
public class VehicleHealthStateService {

    public VehicleHealthDecision evaluate(GpsData gpsData, boolean missionActive) {
        if (gpsData == null) {
            return new VehicleHealthDecision(
                    VehicleHealthState.NORMAL,
                    "Aucune donnée disponible"
            );
        }

        boolean checkEngine = Boolean.TRUE.equals(gpsData.getCheckEngineOn());

        Double temp = gpsData.getEngineTemperature();
        Double battery = gpsData.getBatteryVoltage();
        Double fuel = gpsData.getFuelLevel();
        Double speed = gpsData.getSpeed();
        Double load = gpsData.getEngineLoad();
        Integer rpm = gpsData.getEngineRpm();

        if (missionActive && checkEngine && speed != null && speed <= 1.0) {
            return new VehicleHealthDecision(
                    VehicleHealthState.MISSION_INTERRUPTED,
                    "Mission interrompue à cause d'une alerte moteur"
            );
        }

        if (temp != null && temp >= 115) {
            return new VehicleHealthDecision(
                    VehicleHealthState.BREAKDOWN,
                    "Panne probable : température moteur critique"
            );
        }

        if (checkEngine) {
            return new VehicleHealthDecision(
                    VehicleHealthState.CRITICAL,
                    "Voyant moteur activé"
            );
        }

        if (battery != null && battery <= 11.2) {
            return new VehicleHealthDecision(
                    VehicleHealthState.CRITICAL,
                    "Tension batterie critique"
            );
        }

        if (fuel != null && fuel <= 8) {
            return new VehicleHealthDecision(
                    VehicleHealthState.CRITICAL,
                    "Niveau carburant critique"
            );
        }

        if (temp != null && temp >= 105) {
            return new VehicleHealthDecision(
                    VehicleHealthState.WARNING,
                    "Température moteur élevée"
            );
        }

        if (battery != null && battery <= 11.8) {
            return new VehicleHealthDecision(
                    VehicleHealthState.WARNING,
                    "Batterie faible"
            );
        }

        if (fuel != null && fuel <= 15) {
            return new VehicleHealthDecision(
                    VehicleHealthState.WARNING,
                    "Carburant faible"
            );
        }

        if (load != null && load >= 90 && rpm != null && rpm >= 3500) {
            return new VehicleHealthDecision(
                    VehicleHealthState.WARNING,
                    "Charge moteur élevée avec régime élevé"
            );
        }

        return new VehicleHealthDecision(
                VehicleHealthState.NORMAL,
                "État véhicule normal"
        );
    }

    public record VehicleHealthDecision(
            VehicleHealthState state,
            String reason
    ) {}
}