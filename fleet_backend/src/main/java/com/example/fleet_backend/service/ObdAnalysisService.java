package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.ObdAlertDTO;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ObdAnalysisService {

    public String computeObdStatus(
            Double fuelLevel,
            Double engineTemperature,
            Double batteryVoltage,
            Boolean checkEngineOn
    ) {
        if (Boolean.TRUE.equals(checkEngineOn)) {
            return "CRITICAL";
        }

        if (engineTemperature != null && engineTemperature > 115) {
            return "CRITICAL";
        }

        if (batteryVoltage != null && batteryVoltage < 11.2) {
            return "CRITICAL";
        }

        if (fuelLevel != null && fuelLevel < 8) {
            return "CRITICAL";
        }

        if (engineTemperature != null && engineTemperature > 105) {
            return "WARNING";
        }

        if (batteryVoltage != null && batteryVoltage < 11.8) {
            return "WARNING";
        }

        if (fuelLevel != null && fuelLevel < 15) {
            return "WARNING";
        }

        return "OK";
    }

    public List<ObdAlertDTO> computeAlerts(
            Double fuelLevel,
            Double engineTemperature,
            Double batteryVoltage,
            Boolean checkEngineOn
    ) {
        List<ObdAlertDTO> alerts = new ArrayList<>();

        if (fuelLevel != null && fuelLevel < 8) {
            alerts.add(new ObdAlertDTO(
                    "LOW_FUEL_CRITICAL",
                    "CRITICAL",
                    "Niveau de carburant critique"
            ));
        } else if (fuelLevel != null && fuelLevel < 15) {
            alerts.add(new ObdAlertDTO(
                    "LOW_FUEL_WARNING",
                    "WARNING",
                    "Niveau de carburant faible"
            ));
        }

        if (engineTemperature != null && engineTemperature > 115) {
            alerts.add(new ObdAlertDTO(
                    "HIGH_TEMP_CRITICAL",
                    "CRITICAL",
                    "Température moteur critique"
            ));
        } else if (engineTemperature != null && engineTemperature > 105) {
            alerts.add(new ObdAlertDTO(
                    "HIGH_TEMP_WARNING",
                    "WARNING",
                    "Température moteur élevée"
            ));
        }

        if (batteryVoltage != null && batteryVoltage < 11.2) {
            alerts.add(new ObdAlertDTO(
                    "LOW_BATTERY_CRITICAL",
                    "CRITICAL",
                    "Tension batterie critique"
            ));
        } else if (batteryVoltage != null && batteryVoltage < 11.8) {
            alerts.add(new ObdAlertDTO(
                    "LOW_BATTERY_WARNING",
                    "WARNING",
                    "Tension batterie faible"
            ));
        }

        if (Boolean.TRUE.equals(checkEngineOn)) {
            alerts.add(new ObdAlertDTO(
                    "CHECK_ENGINE_ON",
                    "CRITICAL",
                    "Voyant moteur activé"
            ));
        }

        return alerts;
    }

    public String buildMaintenanceHint(
            Double fuelLevel,
            Double engineTemperature,
            Double batteryVoltage,
            Boolean checkEngineOn
    ) {
        if (Boolean.TRUE.equals(checkEngineOn)) {
            return "Inspection moteur recommandée immédiatement.";
        }

        if (engineTemperature != null && engineTemperature > 105) {
            return "Contrôler le circuit de refroidissement.";
        }

        if (batteryVoltage != null && batteryVoltage < 11.8) {
            return "Vérifier la batterie et le système de charge.";
        }

        if (fuelLevel != null && fuelLevel < 15) {
            return "Prévoir un ravitaillement rapidement.";
        }

        return "Aucune action immédiate requise.";
    }
}