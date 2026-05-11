package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.AiPredictionRequest;
import com.example.fleet_backend.dto.AiPredictionResponse;
import com.example.fleet_backend.dto.PredictiveAlertDTO;
import com.example.fleet_backend.model.*;
import com.example.fleet_backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PredictiveAnalysisService {

    private final PredictiveAlertRepository predictiveAlertRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleEventRepository vehicleEventRepository;
    private final IncidentRepository incidentRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final AiPredictionService aiPredictionService;

    public PredictiveAnalysisService(
            PredictiveAlertRepository predictiveAlertRepository,
            VehicleRepository vehicleRepository,
            VehicleEventRepository vehicleEventRepository,
            IncidentRepository incidentRepository,
            MaintenanceRepository maintenanceRepository,
            AiPredictionService aiPredictionService
    ) {
        this.predictiveAlertRepository = predictiveAlertRepository;
        this.vehicleRepository = vehicleRepository;
        this.vehicleEventRepository = vehicleEventRepository;
        this.incidentRepository = incidentRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.aiPredictionService = aiPredictionService;
    }

    @Transactional(readOnly = true)
    public List<PredictiveAlertDTO> getAll() {
        return predictiveAlertRepository.findTop50ByOrderByCreatedAtDesc()
                .stream()
                .map(PredictiveAlertDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PredictiveAlertDTO> getByVehicle(Long vehicleId) {
        return predictiveAlertRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId)
                .stream()
                .map(PredictiveAlertDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PredictiveAlertDTO> getActiveAlerts() {
        return predictiveAlertRepository.findByResolvedFalseOrderByCreatedAtDesc()
                .stream()
                .map(PredictiveAlertDTO::fromEntity)
                .toList();
    }

    @Transactional
    public PredictiveAlertDTO analyzeVehicle(Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        LocalDateTime since = LocalDateTime.now().minusDays(7);

        List<VehicleEvent> recentEvents =
                vehicleEventRepository.findByVehicleIdAndCreatedAtAfterOrderByCreatedAtDesc(vehicleId, since);

        List<Incident> recentIncidents =
                incidentRepository.findByVehicleIdAndCreatedAtAfterOrderByCreatedAtDesc(vehicleId, since);

        int highTempCount = countEvents(recentEvents, VehicleEventType.OBD_HIGH_TEMP);
        int lowBatteryCount = countEvents(recentEvents, VehicleEventType.OBD_LOW_BATTERY);
        int lowFuelCount = countEvents(recentEvents, VehicleEventType.OBD_LOW_FUEL);
        int engineFailureCount = countEvents(recentEvents, VehicleEventType.ENGINE_FAILURE);

        int overspeedCount = countEvents(recentEvents, VehicleEventType.OVERSPEED);
        int offRouteCount = countEvents(recentEvents, VehicleEventType.OFF_ROUTE);
        int stopLongCount = countEvents(recentEvents, VehicleEventType.STOP_LONG);

        int incidentCount = recentIncidents.size();
        int maintenanceRisk = calculateMaintenanceRisk(vehicleId);

        AiPredictionRequest request = new AiPredictionRequest();
        request.setHighTempCount(highTempCount);
        request.setLowBatteryCount(lowBatteryCount);
        request.setLowFuelCount(lowFuelCount);
        request.setEngineFailureCount(engineFailureCount);
        request.setIncidentCount(incidentCount);
        request.setOverspeedCount(overspeedCount);
        request.setOffRouteCount(offRouteCount);
        request.setStopLongCount(stopLongCount);
        request.setMaintenanceRisk(maintenanceRisk);

        AiPredictionResponse aiResponse;

        try {
            aiResponse = aiPredictionService.predict(request);
        } catch (Exception e) {
            int fallbackVehicleScore = calculateVehicleHealthRisk(
                    highTempCount,
                    lowBatteryCount,
                    lowFuelCount,
                    engineFailureCount,
                    incidentCount,
                    maintenanceRisk
            );

            int fallbackDriverScore = calculateDriverRisk(
                    overspeedCount,
                    offRouteCount,
                    stopLongCount
            );

            if (fallbackVehicleScore >= fallbackDriverScore) {
                return createVehicleHealthAlert(
                        vehicle,
                        fallbackVehicleScore,
                        highTempCount,
                        lowBatteryCount,
                        lowFuelCount,
                        engineFailureCount,
                        incidentCount,
                        maintenanceRisk,
                        "IA Python indisponible. Analyse locale Java utilisée."
                );
            }

            return createDriverRiskAlert(
                    vehicle,
                    fallbackDriverScore,
                    overspeedCount,
                    offRouteCount,
                    stopLongCount,
                    "IA Python indisponible. Analyse locale Java utilisée."
            );
        }

        PredictiveAlertDTO vehicleAlert = null;
        PredictiveAlertDTO driverAlert = null;

        if (aiResponse.getVehicleRiskScore() >= 30) {
            vehicleAlert = createVehicleAlertFromAi(
                    vehicle,
                    aiResponse,
                    highTempCount,
                    lowBatteryCount,
                    lowFuelCount,
                    engineFailureCount,
                    incidentCount,
                    maintenanceRisk
            );
        }

        if (aiResponse.getDriverRiskScore() >= 30) {
            driverAlert = createDriverAlertFromAi(
                    vehicle,
                    aiResponse,
                    overspeedCount,
                    offRouteCount,
                    stopLongCount
            );
        }

        if (vehicleAlert != null && driverAlert != null) {
            return aiResponse.getVehicleRiskScore() >= aiResponse.getDriverRiskScore()
                    ? vehicleAlert
                    : driverAlert;
        }

        if (vehicleAlert != null) return vehicleAlert;
        if (driverAlert != null) return driverAlert;

        return createOrUpdateAlert(
                vehicle,
                PredictiveAlertType.MAINTENANCE_RECOMMENDED,
                aiResponse.getVehicleRiskScore(),
                "AI analysis normal",
                "Aucun risque prédictif important détecté.",
                aiResponse.getRecommendation() != null
                        ? aiResponse.getRecommendation()
                        : "Continuer le suivi normal du véhicule."
        );
    }

    @Transactional
    public PredictiveAlertDTO resolveAlert(Long alertId) {
        PredictiveAlert alert = predictiveAlertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Predictive alert not found"));

        alert.setResolved(true);
        alert.setResolvedAt(LocalDateTime.now());

        return PredictiveAlertDTO.fromEntity(predictiveAlertRepository.save(alert));
    }

    private PredictiveAlertDTO createVehicleAlertFromAi(
            Vehicle vehicle,
            AiPredictionResponse aiResponse,
            int highTempCount,
            int lowBatteryCount,
            int lowFuelCount,
            int engineFailureCount,
            int incidentCount,
            int maintenanceRisk
    ) {
        PredictiveAlertType type = mapAiVehiclePrediction(aiResponse.getVehiclePrediction());

        String message =
                "Analyse IA Python - état véhicule : "
                        + highTempCount + " alertes température élevée, "
                        + lowBatteryCount + " alertes batterie faible, "
                        + lowFuelCount + " alertes carburant faible, "
                        + engineFailureCount + " pannes moteur, "
                        + incidentCount + " incidents récents, "
                        + "risque maintenance=" + maintenanceRisk + ".";

        return createOrUpdateAlert(
                vehicle,
                type,
                aiResponse.getVehicleRiskScore(),
                "AI predictive vehicle risk detected",
                message,
                aiResponse.getRecommendation()
        );
    }

    private PredictiveAlertDTO createDriverAlertFromAi(
            Vehicle vehicle,
            AiPredictionResponse aiResponse,
            int overspeedCount,
            int offRouteCount,
            int stopLongCount
    ) {
        PredictiveAlertType type = mapAiDriverBehavior(
                aiResponse.getDriverBehavior(),
                overspeedCount,
                offRouteCount
        );

        String message =
                "Analyse IA Python - comportement conducteur : "
                        + overspeedCount + " excès de vitesse, "
                        + offRouteCount + " sorties de route, "
                        + stopLongCount + " arrêts longs. "
                        + "Comportement détecté : "
                        + aiResponse.getDriverBehavior() + ".";

        return createOrUpdateAlert(
                vehicle,
                type,
                aiResponse.getDriverRiskScore(),
                "AI driver risk behavior detected",
                message,
                aiResponse.getRecommendation()
        );
    }

    private PredictiveAlertType mapAiVehiclePrediction(String prediction) {
        if (prediction == null) {
            return PredictiveAlertType.MAINTENANCE_RECOMMENDED;
        }

        return switch (prediction) {
            case "ENGINE_FAILURE_RISK" -> PredictiveAlertType.ENGINE_FAILURE_RISK;
            case "BATTERY_REPLACEMENT_RISK" -> PredictiveAlertType.BATTERY_REPLACEMENT_RISK;
            case "LOW_FUEL_RISK" -> PredictiveAlertType.LOW_FUEL_RISK;
            case "HIGH_TEMPERATURE_RISK" -> PredictiveAlertType.HIGH_TEMPERATURE_RISK;
            case "MAINTENANCE_RECOMMENDED" -> PredictiveAlertType.MAINTENANCE_RECOMMENDED;
            default -> PredictiveAlertType.MAINTENANCE_RECOMMENDED;
        };
    }

    private PredictiveAlertType mapAiDriverBehavior(
            String behavior,
            int overspeedCount,
            int offRouteCount
    ) {
        if ("AGGRESSIVE_DRIVING".equals(behavior)
                || "DANGEROUS_DRIVING".equals(behavior)
                || "UNSTABLE_DRIVING".equals(behavior)) {
            return overspeedCount >= offRouteCount
                    ? PredictiveAlertType.OVERSPEED_REPEATED
                    : PredictiveAlertType.OFF_ROUTE_REPEATED;
        }

        return PredictiveAlertType.DRIVER_RISK_BEHAVIOR;
    }

    private int countEvents(List<VehicleEvent> events, VehicleEventType type) {
        return (int) events.stream()
                .filter(e -> e.getEventType() == type)
                .count();
    }

    private int calculateVehicleHealthRisk(
            int highTempCount,
            int lowBatteryCount,
            int lowFuelCount,
            int engineFailureCount,
            int incidentCount,
            int maintenanceRisk
    ) {
        int score = 0;

        score += Math.min(highTempCount * 10, 30);
        score += Math.min(lowBatteryCount * 8, 24);
        score += Math.min(lowFuelCount * 5, 15);
        score += Math.min(engineFailureCount * 35, 40);
        score += Math.min(incidentCount * 8, 24);
        score += maintenanceRisk;

        return Math.min(score, 100);
    }

    private int calculateDriverRisk(
            int overspeedCount,
            int offRouteCount,
            int stopLongCount
    ) {
        int score = 0;

        score += Math.min(overspeedCount * 8, 40);
        score += Math.min(offRouteCount * 10, 30);
        score += Math.min(stopLongCount * 5, 15);

        return Math.min(score, 100);
    }

    private int calculateMaintenanceRisk(Long vehicleId) {
        return maintenanceRepository.findTopByVehicleIdOrderByCreatedAtDesc(vehicleId)
                .map(maintenance -> {
                    LocalDateTime lastDate = maintenance.getCreatedAt();
                    if (lastDate == null) return 20;

                    long days = java.time.Duration.between(lastDate, LocalDateTime.now()).toDays();

                    if (days >= 120) return 25;
                    if (days >= 90) return 20;
                    if (days >= 60) return 10;
                    return 0;
                })
                .orElse(20);
    }

    private PredictiveAlertDTO createVehicleHealthAlert(
            Vehicle vehicle,
            int score,
            int highTempCount,
            int lowBatteryCount,
            int lowFuelCount,
            int engineFailureCount,
            int incidentCount,
            int maintenanceRisk,
            String prefix
    ) {
        PredictiveAlertType type = chooseVehicleAlertType(
                highTempCount,
                lowBatteryCount,
                lowFuelCount,
                engineFailureCount
        );

        String message =
                prefix + " "
                        + "Analyse prédictive véhicule : "
                        + highTempCount + " alertes température élevée, "
                        + lowBatteryCount + " alertes batterie faible, "
                        + lowFuelCount + " alertes carburant faible, "
                        + engineFailureCount + " pannes moteur, "
                        + incidentCount + " incidents récents, "
                        + "risque maintenance=" + maintenanceRisk + ".";

        String recommendation = buildVehicleRecommendation(type, score);

        return createOrUpdateAlert(
                vehicle,
                type,
                score,
                "Predictive vehicle risk detected",
                message,
                recommendation
        );
    }

    private PredictiveAlertDTO createDriverRiskAlert(
            Vehicle vehicle,
            int score,
            int overspeedCount,
            int offRouteCount,
            int stopLongCount,
            String prefix
    ) {
        String message =
                prefix + " "
                        + "Analyse comportement conducteur : "
                        + overspeedCount + " excès de vitesse, "
                        + offRouteCount + " sorties de route, "
                        + stopLongCount + " arrêts longs détectés sur les 7 derniers jours.";

        String recommendation =
                "Surveiller le comportement du conducteur, vérifier le respect de l’itinéraire et limiter les excès de vitesse.";

        PredictiveAlertType type = overspeedCount >= offRouteCount
                ? PredictiveAlertType.OVERSPEED_REPEATED
                : PredictiveAlertType.OFF_ROUTE_REPEATED;

        return createOrUpdateAlert(
                vehicle,
                type,
                score,
                "Driver risk behavior detected",
                message,
                recommendation
        );
    }

    private PredictiveAlertDTO createOrUpdateAlert(
            Vehicle vehicle,
            PredictiveAlertType type,
            int score,
            String title,
            String message,
            String recommendation
    ) {
        PredictiveAlert alert = predictiveAlertRepository
                .findTopByVehicleIdAndTypeAndResolvedFalseOrderByCreatedAtDesc(vehicle.getId(), type)
                .orElseGet(PredictiveAlert::new);

        alert.setVehicle(vehicle);
        alert.setType(type);
        alert.setRiskScore(Math.min(score, 100));
        alert.setRiskLevel(resolveRiskLevel(score));
        alert.setTitle(title);
        alert.setMessage(message);
        alert.setRecommendation(recommendation != null ? recommendation : "Continuer le suivi du véhicule.");

        return PredictiveAlertDTO.fromEntity(predictiveAlertRepository.save(alert));
    }

    private PredictiveAlertType chooseVehicleAlertType(
            int highTempCount,
            int lowBatteryCount,
            int lowFuelCount,
            int engineFailureCount
    ) {
        if (engineFailureCount > 0 || highTempCount >= 3) {
            return PredictiveAlertType.ENGINE_FAILURE_RISK;
        }

        if (lowBatteryCount >= 3) {
            return PredictiveAlertType.BATTERY_REPLACEMENT_RISK;
        }

        if (lowFuelCount >= 3) {
            return PredictiveAlertType.LOW_FUEL_RISK;
        }

        return PredictiveAlertType.MAINTENANCE_RECOMMENDED;
    }

    private String buildVehicleRecommendation(PredictiveAlertType type, int score) {
        if (score >= 80) {
            return switch (type) {
                case ENGINE_FAILURE_RISK ->
                        "Planifier une maintenance moteur urgente. Vérifier température moteur, refroidissement et historique OBD.";
                case BATTERY_REPLACEMENT_RISK ->
                        "Vérifier ou remplacer la batterie rapidement.";
                case LOW_FUEL_RISK ->
                        "Contrôler la consommation carburant et vérifier une éventuelle anomalie.";
                default ->
                        "Planifier une maintenance préventive urgente.";
            };
        }

        if (score >= 60) {
            return "Planifier une inspection technique dans les prochains jours.";
        }

        if (score >= 30) {
            return "Surveiller le véhicule et continuer l’analyse des prochaines alertes.";
        }

        return "Aucune action urgente nécessaire.";
    }

    private PredictiveRiskLevel resolveRiskLevel(int score) {
        if (score >= 80) return PredictiveRiskLevel.CRITICAL;
        if (score >= 60) return PredictiveRiskLevel.HIGH;
        if (score >= 30) return PredictiveRiskLevel.WARNING;
        return PredictiveRiskLevel.NORMAL;
    }
}