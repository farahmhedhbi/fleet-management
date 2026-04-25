package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.ObdAlertDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ObdAnalysisService {

    private final double criticalEngineTemperature;
    private final double warningEngineTemperature;
    private final double criticalBatteryVoltage;
    private final double warningBatteryVoltage;
    private final double criticalFuelLevel;
    private final double warningFuelLevel;

    public ObdAnalysisService(
            @Value("${obd.critical-engine-temperature:115}") double criticalEngineTemperature,
            @Value("${obd.warning-engine-temperature:105}") double warningEngineTemperature,
            @Value("${obd.critical-battery-voltage:11.2}") double criticalBatteryVoltage,
            @Value("${obd.warning-battery-voltage:11.8}") double warningBatteryVoltage,
            @Value("${obd.critical-fuel-level:8}") double criticalFuelLevel,
            @Value("${obd.warning-fuel-level:15}") double warningFuelLevel
    ) {
        this.criticalEngineTemperature = criticalEngineTemperature;
        this.warningEngineTemperature = warningEngineTemperature;
        this.criticalBatteryVoltage = criticalBatteryVoltage;
        this.warningBatteryVoltage = warningBatteryVoltage;
        this.criticalFuelLevel = criticalFuelLevel;
        this.warningFuelLevel = warningFuelLevel;
    }

    public String computeObdStatus(Double fuelLevel,
                                   Double engineTemperature,
                                   Double batteryVoltage,
                                   Boolean checkEngineOn) {
        if (Boolean.TRUE.equals(checkEngineOn)) return "CRITICAL";

        if (engineTemperature != null && engineTemperature >= criticalEngineTemperature) return "CRITICAL";
        if (batteryVoltage != null && batteryVoltage <= criticalBatteryVoltage) return "CRITICAL";
        if (fuelLevel != null && fuelLevel <= criticalFuelLevel) return "CRITICAL";

        if (engineTemperature != null && engineTemperature >= warningEngineTemperature) return "WARNING";
        if (batteryVoltage != null && batteryVoltage <= warningBatteryVoltage) return "WARNING";
        if (fuelLevel != null && fuelLevel <= warningFuelLevel) return "WARNING";

        return "OK";
    }

    public List<ObdAlertDTO> computeAlerts(Double fuelLevel,
                                           Double engineTemperature,
                                           Double batteryVoltage,
                                           Boolean checkEngineOn) {
        List<ObdAlertDTO> alerts = new ArrayList<>();

        if (fuelLevel != null && fuelLevel <= criticalFuelLevel) {
            alerts.add(new ObdAlertDTO("LOW_FUEL_CRITICAL", "CRITICAL",
                    "Niveau de carburant critique : " + fuelLevel + "%"));
        } else if (fuelLevel != null && fuelLevel <= warningFuelLevel) {
            alerts.add(new ObdAlertDTO("LOW_FUEL_WARNING", "WARNING",
                    "Niveau de carburant faible : " + fuelLevel + "%"));
        }

        if (engineTemperature != null && engineTemperature >= criticalEngineTemperature) {
            alerts.add(new ObdAlertDTO("HIGH_TEMP_CRITICAL", "CRITICAL",
                    "Température moteur critique : " + engineTemperature + "°C"));
        } else if (engineTemperature != null && engineTemperature >= warningEngineTemperature) {
            alerts.add(new ObdAlertDTO("HIGH_TEMP_WARNING", "WARNING",
                    "Température moteur élevée : " + engineTemperature + "°C"));
        }

        if (batteryVoltage != null && batteryVoltage <= criticalBatteryVoltage) {
            alerts.add(new ObdAlertDTO("LOW_BATTERY_CRITICAL", "CRITICAL",
                    "Tension batterie critique : " + batteryVoltage + "V"));
        } else if (batteryVoltage != null && batteryVoltage <= warningBatteryVoltage) {
            alerts.add(new ObdAlertDTO("LOW_BATTERY_WARNING", "WARNING",
                    "Tension batterie faible : " + batteryVoltage + "V"));
        }

        if (Boolean.TRUE.equals(checkEngineOn)) {
            alerts.add(new ObdAlertDTO("CHECK_ENGINE_ON", "CRITICAL",
                    "Voyant moteur activé"));
        }

        return alerts;
    }

    public String buildMaintenanceHint(Double fuelLevel,
                                       Double engineTemperature,
                                       Double batteryVoltage,
                                       Boolean checkEngineOn) {
        if (Boolean.TRUE.equals(checkEngineOn)) {
            return "Inspection moteur recommandée immédiatement.";
        }

        if (engineTemperature != null && engineTemperature >= criticalEngineTemperature) {
            return "Arrêter le véhicule et contrôler immédiatement le circuit de refroidissement.";
        }

        if (engineTemperature != null && engineTemperature >= warningEngineTemperature) {
            return "Surveiller la température moteur et vérifier le refroidissement.";
        }

        if (batteryVoltage != null && batteryVoltage <= criticalBatteryVoltage) {
            return "Batterie critique : contrôler alternateur et batterie immédiatement.";
        }

        if (batteryVoltage != null && batteryVoltage <= warningBatteryVoltage) {
            return "Vérifier la batterie et le système de charge.";
        }

        if (fuelLevel != null && fuelLevel <= criticalFuelLevel) {
            return "Carburant critique : ravitaillement urgent.";
        }

        if (fuelLevel != null && fuelLevel <= warningFuelLevel) {
            return "Prévoir un ravitaillement rapidement.";
        }

        return "Aucune action immédiate requise.";
    }
}