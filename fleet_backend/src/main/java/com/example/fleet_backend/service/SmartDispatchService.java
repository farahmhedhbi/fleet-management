package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.*;
import com.example.fleet_backend.model.*;
import com.example.fleet_backend.repository.*;
import com.example.fleet_backend.security.AuthUtil;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class SmartDispatchService {

    private static final double MIN_FUEL_LEVEL = 15.0;
    private static final double RETURN_DEPOT_THRESHOLD_KM = 30.0;

    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final GpsDataRepository gpsDataRepository;
    private final MissionRepository missionRepository;
    private final IncidentRepository incidentRepository;
    private final MaintenanceRepository maintenanceRepository;
    private final UserRepository userRepository;
    private final RoutePlannerService routePlannerService;

    public SmartDispatchService(
            VehicleRepository vehicleRepository,
            DriverRepository driverRepository,
            GpsDataRepository gpsDataRepository,
            MissionRepository missionRepository,
            IncidentRepository incidentRepository,
            MaintenanceRepository maintenanceRepository,
            UserRepository userRepository,
            RoutePlannerService routePlannerService
    ) {
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
        this.gpsDataRepository = gpsDataRepository;
        this.missionRepository = missionRepository;
        this.incidentRepository = incidentRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.userRepository = userRepository;
        this.routePlannerService = routePlannerService;
    }

    @Transactional(readOnly = true)
    public DispatchSuggestionDTO smartAssignment(SmartAssignmentRequest request, Authentication auth) {
        validateMissionRequest(request);

        Long ownerId = AuthUtil.userId(auth);

        List<Vehicle> vehicles = vehicleRepository.findByOwnerId(ownerId);
        List<Driver> drivers = driverRepository.findByOwnerId(ownerId);

        if (vehicles.isEmpty()) {
            throw new IllegalArgumentException("Aucun véhicule disponible pour cet owner.");
        }

        if (drivers.isEmpty()) {
            throw new IllegalArgumentException("Aucun driver disponible pour cet owner.");
        }

        Vehicle bestVehicle = null;
        Driver bestDriver = null;
        int bestScore = -1;

        List<String> bestReasons = new ArrayList<>();
        List<String> bestWarnings = new ArrayList<>();

        for (Vehicle vehicle : vehicles) {
            VehicleScore vehicleScore = scoreVehicle(vehicle, request);

            if (!vehicleScore.eligible) {
                continue;
            }

            for (Driver driver : drivers) {
                DriverScore driverScore = scoreDriver(driver, request);

                if (!driverScore.eligible) {
                    continue;
                }

                int totalScore = vehicleScore.score + driverScore.score;

                if (totalScore > bestScore) {
                    bestScore = totalScore;
                    bestVehicle = vehicle;
                    bestDriver = driver;

                    bestReasons = new ArrayList<>();
                    bestWarnings = new ArrayList<>();

                    bestReasons.addAll(vehicleScore.reasons);
                    bestReasons.addAll(driverScore.reasons);

                    bestWarnings.addAll(vehicleScore.warnings);
                    bestWarnings.addAll(driverScore.warnings);
                }
            }
        }

        if (bestVehicle == null || bestDriver == null) {
            throw new IllegalArgumentException("Aucune combinaison véhicule/driver disponible pour cette mission.");
        }

        DispatchSuggestionDTO dto = new DispatchSuggestionDTO();

        dto.setMode(DispatchMode.SMART_ASSIGNMENT.name());
        dto.setModuleName("Smart Vehicle Suggestion");

        dto.setVehicleId(bestVehicle.getId());
        dto.setVehiclePlate(bestVehicle.getRegistrationNumber());

        dto.setDriverId(bestDriver.getId());
        dto.setDriverName(fullName(bestDriver));

        dto.setStartCity(request.getStartCity());
        dto.setFinalCity(request.getDestinationCity());

        dto.setScore(bestScore);
        dto.setReasons(bestReasons);
        dto.setWarnings(bestWarnings);

        DispatchStepDTO step = new DispatchStepDTO();
        step.setType(DispatchStepType.MISSION);
        step.setLabel(request.getStartCity() + " → " + request.getDestinationCity());
        step.setFromCity(request.getStartCity());
        step.setToCity(request.getDestinationCity());
        step.setStartTime(request.getStartTime());
        step.setEndTime(request.getExpectedEndTime());
        step.setVehicleId(bestVehicle.getId());
        step.setVehiclePlate(bestVehicle.getRegistrationNumber());
        step.setDriverId(bestDriver.getId());
        step.setDriverName(fullName(bestDriver));
        step.setDurationMinutes((int) Duration.between(
                request.getStartTime(),
                request.getExpectedEndTime()
        ).toMinutes());

        dto.getSteps().add(step);

        return dto;
    }

    @Transactional(readOnly = true)
    public DispatchSuggestionDTO smartDailyPlanning(SmartDailyPlanningRequest request, Authentication auth) {
        validateDailyPlanningRequest(request);

        Long ownerId = AuthUtil.userId(auth);

        List<DispatchMissionRequest> missions = new ArrayList<>(request.getMissions());
        missions.sort(Comparator.comparing(DispatchMissionRequest::getStartTime));

        List<Vehicle> vehicles = vehicleRepository.findByOwnerId(ownerId);
        List<Driver> drivers = driverRepository.findByOwnerId(ownerId);

        if (vehicles.isEmpty()) {
            throw new IllegalArgumentException("Aucun véhicule disponible pour cet owner.");
        }

        if (drivers.isEmpty()) {
            throw new IllegalArgumentException("Aucun driver disponible pour cet owner.");
        }

        DispatchSuggestionDTO bestPlan = null;
        int bestScore = -1;

        for (Vehicle vehicle : vehicles) {
            for (Driver driver : drivers) {
                DispatchSuggestionDTO plan = buildDailyPlanForVehicleAndDriver(
                        vehicle,
                        driver,
                        missions,
                        request
                );

                if (plan != null && plan.getScore() != null && plan.getScore() > bestScore) {
                    bestScore = plan.getScore();
                    bestPlan = plan;
                }
            }
        }

        if (bestPlan == null) {
            throw new IllegalArgumentException("Aucun planning valide trouvé.");
        }

        return bestPlan;
    }

    public List<CreatedMissionDTO> confirmDailyPlanning(
            ConfirmDailyPlanningRequest request,
            Authentication auth
    ) {
        Long ownerId = AuthUtil.userId(auth);

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Owner introuvable."));

        if (request == null || request.getSuggestion() == null) {
            throw new IllegalArgumentException("Suggestion planning manquante.");
        }

        DispatchSuggestionDTO suggestion = request.getSuggestion();

        if (suggestion.getVehicleId() == null || suggestion.getDriverId() == null) {
            throw new IllegalArgumentException("Véhicule ou driver manquant.");
        }

        Vehicle vehicle = vehicleRepository.findById(suggestion.getVehicleId())
                .orElseThrow(() -> new IllegalArgumentException("Véhicule introuvable."));

        Driver driver = driverRepository.findById(suggestion.getDriverId())
                .orElseThrow(() -> new IllegalArgumentException("Driver introuvable."));

        if (vehicle.getOwner() == null || !vehicle.getOwner().getId().equals(ownerId)) {
            throw new IllegalArgumentException("Ce véhicule n'appartient pas à cet owner.");
        }

        if (driver.getOwner() == null || !driver.getOwner().getId().equals(ownerId)) {
            throw new IllegalArgumentException("Ce driver n'appartient pas à cet owner.");
        }

        List<DispatchStepDTO> missionSteps = suggestion.getSteps()
                .stream()
                .filter(step -> step.getType() == DispatchStepType.MISSION)
                .collect(Collectors.toList());

        if (missionSteps.isEmpty()) {
            throw new IllegalArgumentException("Aucune mission à créer.");
        }

        missionSteps.sort(Comparator.comparing(DispatchStepDTO::getStartTime));

        validateDailyPlanningInternalOrder(missionSteps);

        validateVehicleAndDriverNotBusyBeforeCreation(
                vehicle.getId(),
                driver.getId(),
                missionSteps
        );

        List<CreatedMissionDTO> createdMissions = new ArrayList<>();

        for (DispatchStepDTO step : missionSteps) {
            Mission mission = new Mission();

            mission.setTitle(step.getFromCity() + " → " + step.getToCity());
            mission.setDescription("Mission créée depuis Smart Daily Planning");
            mission.setDeparture(step.getFromCity());
            mission.setDestination(step.getToCity());
            mission.setStartDate(step.getStartTime());
            mission.setEndDate(step.getEndTime());
            mission.setOwner(owner);
            mission.setVehicle(vehicle);
            mission.setDriver(driver);
            mission.setStatus(Mission.MissionStatus.PLANNED);
            mission.setLateAlertSent(false);

            try {
                RoutePlanResult routePlan = routePlannerService.buildRoutePlan(
                        step.getFromCity(),
                        step.getToCity()
                );
                mission.setRouteJson(routePlan.getRouteJson());
            } catch (Exception e) {
                mission.setRouteJson(null);
            }

            Mission saved = missionRepository.save(mission);
            createdMissions.add(CreatedMissionDTO.fromEntity(saved));
        }

        if (suggestion.isReturnToDepotSuggested()) {
            vehicle.setStatus(Vehicle.VehicleStatus.AVAILABLE);
            vehicle.setCurrentCity(suggestion.getDepotCity());
        } else if (suggestion.isVehicleStaysWithDriver()) {
            vehicle.setStatus(Vehicle.VehicleStatus.WITH_DRIVER);
            vehicle.setCurrentCity(suggestion.getFinalCity());
        } else {
            vehicle.setStatus(Vehicle.VehicleStatus.AVAILABLE);
            vehicle.setCurrentCity(suggestion.getFinalCity());
        }

        vehicleRepository.save(vehicle);

        return createdMissions;
    }

    private DispatchSuggestionDTO buildDailyPlanForVehicleAndDriver(
            Vehicle vehicle,
            Driver driver,
            List<DispatchMissionRequest> missions,
            SmartDailyPlanningRequest request
    ) {
        DispatchSuggestionDTO dto = new DispatchSuggestionDTO();

        dto.setMode(DispatchMode.SMART_DAILY_PLANNING.name());
        dto.setModuleName("Smart Daily Dispatching with Driver Rest Management");

        dto.setVehicleId(vehicle.getId());
        dto.setVehiclePlate(vehicle.getRegistrationNumber());

        dto.setDriverId(driver.getId());
        dto.setDriverName(fullName(driver));

        dto.setDepotCity(request.getDepotCity());
        dto.setStartCity(missions.get(0).getStartCity());
        dto.setFinalCity(missions.get(missions.size() - 1).getDestinationCity());

        int score = 100;
        LocalDateTime driverAvailableAt = driver.getAvailableAt();

        for (DispatchMissionRequest missionRequest : missions) {
            VehicleScore vehicleScore = scoreVehicle(vehicle, missionRequest);
            DriverScore driverScore = scoreDriver(driver, missionRequest);

            if (!vehicleScore.eligible || !driverScore.eligible) {
                return null;
            }

            if (driverAvailableAt != null && missionRequest.getStartTime().isBefore(driverAvailableAt)) {
                return null;
            }

            score += vehicleScore.score;
            score += driverScore.score;

            dto.getReasons().addAll(vehicleScore.reasons);
            dto.getReasons().addAll(driverScore.reasons);

            dto.getWarnings().addAll(vehicleScore.warnings);
            dto.getWarnings().addAll(driverScore.warnings);

            DispatchStepDTO missionStep = new DispatchStepDTO();
            missionStep.setType(DispatchStepType.MISSION);
            missionStep.setLabel(missionRequest.getStartCity() + " → " + missionRequest.getDestinationCity());
            missionStep.setFromCity(missionRequest.getStartCity());
            missionStep.setToCity(missionRequest.getDestinationCity());
            missionStep.setStartTime(missionRequest.getStartTime());
            missionStep.setEndTime(missionRequest.getExpectedEndTime());
            missionStep.setVehicleId(vehicle.getId());
            missionStep.setVehiclePlate(vehicle.getRegistrationNumber());
            missionStep.setDriverId(driver.getId());
            missionStep.setDriverName(fullName(driver));
            missionStep.setDurationMinutes((int) Duration.between(
                    missionRequest.getStartTime(),
                    missionRequest.getExpectedEndTime()
            ).toMinutes());

            dto.getSteps().add(missionStep);

            long missionDurationMinutes = Duration.between(
                    missionRequest.getStartTime(),
                    missionRequest.getExpectedEndTime()
            ).toMinutes();

            long restMinutes = calculateRestMinutes(missionDurationMinutes);

            DispatchStepDTO restStep = new DispatchStepDTO();
            restStep.setType(DispatchStepType.REST);
            restStep.setLabel("Driver rest " + restMinutes + " min");
            restStep.setStartTime(missionRequest.getExpectedEndTime());
            restStep.setEndTime(missionRequest.getExpectedEndTime().plusMinutes(restMinutes));
            restStep.setDriverId(driver.getId());
            restStep.setDriverName(fullName(driver));
            restStep.setDurationMinutes((int) restMinutes);

            dto.getSteps().add(restStep);

            driverAvailableAt = restStep.getEndTime();
        }

        DispatchMissionRequest lastMission = missions.get(missions.size() - 1);

        applyReturnDepotLogic(
                dto,
                vehicle,
                driver,
                lastMission,
                request,
                driverAvailableAt
        );

        if (dto.isReturnToDepotSuggested()) {
            score += 10;
        }

        dto.setScore(score);

        return dto;
    }

    private void applyReturnDepotLogic(
            DispatchSuggestionDTO dto,
            Vehicle vehicle,
            Driver driver,
            DispatchMissionRequest lastMission,
            SmartDailyPlanningRequest request,
            LocalDateTime driverAvailableAt
    ) {
        if (request.getDepotCity() == null
                || request.getDepotLatitude() == null
                || request.getDepotLongitude() == null
                || lastMission.getDestinationLatitude() == null
                || lastMission.getDestinationLongitude() == null) {

            dto.setReturnToDepotSuggested(false);
            dto.setVehicleStaysWithDriver(true);
            dto.setNextDayDecisionRequired(true);
            dto.setReturnDepotReason("Depot ou position finale manquante.");
            dto.getWarnings().add("Impossible d'analyser le retour dépôt : données GPS manquantes.");
            return;
        }

        double distanceToDepot = distanceKm(
                lastMission.getDestinationLatitude(),
                lastMission.getDestinationLongitude(),
                request.getDepotLatitude(),
                request.getDepotLongitude()
        );

        dto.setDistanceToDepotKm(distanceToDepot);

        if (distanceToDepot <= RETURN_DEPOT_THRESHOLD_KM) {
            dto.setReturnToDepotSuggested(true);
            dto.setVehicleStaysWithDriver(false);
            dto.setNextDayDecisionRequired(false);
            dto.setReturnDepotReason("Vehicle close to depot");

            int duration = estimateDurationMinutes(distanceToDepot);

            DispatchStepDTO depotStep = new DispatchStepDTO();
            depotStep.setType(DispatchStepType.RETURN_TO_DEPOT);
            depotStep.setLabel("Retour au dépôt : " + request.getDepotCity());
            depotStep.setFromCity(lastMission.getDestinationCity());
            depotStep.setToCity(request.getDepotCity());
            depotStep.setStartTime(driverAvailableAt);
            depotStep.setEndTime(driverAvailableAt.plusMinutes(duration));
            depotStep.setVehicleId(vehicle.getId());
            depotStep.setVehiclePlate(vehicle.getRegistrationNumber());
            depotStep.setDriverId(driver.getId());
            depotStep.setDriverName(fullName(driver));
            depotStep.setDurationMinutes(duration);

            dto.getSteps().add(depotStep);
            dto.getReasons().add("Retour dépôt proposé : véhicule proche du dépôt.");
        } else {
            dto.setReturnToDepotSuggested(false);
            dto.setVehicleStaysWithDriver(true);
            dto.setNextDayDecisionRequired(true);
            dto.setReturnDepotReason("Vehicle too far from depot");
            dto.getReasons().add("Pas de retour dépôt : véhicule trop loin du dépôt.");
        }
    }

    private DriverScore scoreDriver(Driver driver, DispatchMissionRequest request) {
        DriverScore result = new DriverScore();

        if (driver.getStatus() == null) {
            result.eligible = false;
            result.warnings.add("Driver status manquant.");
            return result;
        }

        if (driver.getStatus() == Driver.DriverStatus.UNAVAILABLE
                || driver.getStatus() == Driver.DriverStatus.OFF_DUTY
                || driver.getStatus() == Driver.DriverStatus.SUSPENDED
                || driver.getStatus() == Driver.DriverStatus.INACTIVE
                || driver.getStatus() == Driver.DriverStatus.ON_LEAVE
                || driver.getStatus() == Driver.DriverStatus.ON_MISSION
                || driver.getStatus() == Driver.DriverStatus.RESERVED) {
            result.eligible = false;
            result.warnings.add("Driver non disponible.");
            return result;
        }

        if (driver.getAvailableAt() != null && driver.getAvailableAt().isAfter(request.getStartTime())) {
            result.eligible = false;
            result.warnings.add("Driver en repos jusqu'à " + driver.getAvailableAt());
            return result;
        }

        if (missionRepository.existsByDriverIdAndStatus(driver.getId(), Mission.MissionStatus.IN_PROGRESS)) {
            result.eligible = false;
            result.warnings.add("Driver déjà en mission.");
            return result;
        }

        boolean hasOverlap = missionRepository.existsDriverOverlap(
                driver.getId(),
                request.getStartTime(),
                request.getExpectedEndTime()
        );

        if (hasOverlap) {
            result.eligible = false;
            result.warnings.add("Driver déjà réservé dans cette période.");
            return result;
        }

        Optional<Mission> lastMissionOpt = missionRepository.findTopByDriverIdOrderByEndDateDesc(driver.getId());

        if (lastMissionOpt.isPresent()) {
            Mission lastMission = lastMissionOpt.get();

            if (lastMission.getStartDate() != null && lastMission.getEndDate() != null) {
                long lastMissionDuration = Duration.between(
                        lastMission.getStartDate(),
                        lastMission.getEndDate()
                ).toMinutes();

                long requiredRest = calculateRestMinutes(lastMissionDuration);
                LocalDateTime requiredAvailableAt = lastMission.getEndDate().plusMinutes(requiredRest);

                if (request.getStartTime().isBefore(requiredAvailableAt)) {
                    result.eligible = false;
                    result.warnings.add("Temps de repos insuffisant pour le driver.");
                    return result;
                }

                result.score += 20;
                result.reasons.add("Temps de repos respecté.");
            }
        } else {
            result.score += 20;
            result.reasons.add("Driver libre sans mission précédente.");
        }

        if (driver.getEcoScore() != null) {
            if (driver.getEcoScore() >= 80) {
                result.score += 15;
                result.reasons.add("Driver avec bon eco-score.");
            } else if (driver.getEcoScore() < 50) {
                result.score -= 10;
                result.warnings.add("Eco-score driver faible.");
            }
        }

        result.eligible = true;
        return result;
    }

    private VehicleScore scoreVehicle(Vehicle vehicle, DispatchMissionRequest request) {
        VehicleScore result = new VehicleScore();

        if (vehicle.getStatus() == Vehicle.VehicleStatus.OUT_OF_SERVICE) {
            result.eligible = false;
            result.warnings.add("Véhicule hors service.");
            return result;
        }

        if (vehicle.getStatus() == Vehicle.VehicleStatus.UNDER_MAINTENANCE) {
            result.eligible = false;
            result.warnings.add("Véhicule en maintenance.");
            return result;
        }

        if (vehicle.getStatus() == Vehicle.VehicleStatus.RESERVED) {
            result.eligible = false;
            result.warnings.add("Véhicule déjà réservé.");
            return result;
        }

        if (missionRepository.existsByVehicleIdAndStatus(vehicle.getId(), Mission.MissionStatus.IN_PROGRESS)) {
            result.eligible = false;
            result.warnings.add("Véhicule déjà en mission.");
            return result;
        }

        boolean hasOverlap = missionRepository.existsVehicleOverlap(
                vehicle.getId(),
                request.getStartTime(),
                request.getExpectedEndTime()
        );

        if (hasOverlap) {
            result.eligible = false;
            result.warnings.add("Véhicule déjà réservé dans cette période.");
            return result;
        }

        boolean maintenanceConflict = maintenanceRepository.hasMaintenanceConflict(
                vehicle.getId(),
                List.of(
                        MaintenanceStatus.PLANNED,
                        MaintenanceStatus.IN_PROGRESS,
                        MaintenanceStatus.OVERDUE
                ),
                request.getStartTime(),
                request.getExpectedEndTime()
        );

        if (maintenanceConflict) {
            result.eligible = false;
            result.warnings.add("Véhicule indisponible : maintenance pendant cette période.");
            return result;
        }

        boolean hasOpenIncident = incidentRepository.existsByVehicleIdAndStatusIn(
                vehicle.getId(),
                List.of(IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS)
        );

        if (hasOpenIncident) {
            result.score -= 30;
            result.warnings.add("Véhicule avec incident ouvert.");
        }

        Double fuel = vehicle.getLastFuelLevel();

        if (fuel != null) {
            if (fuel < MIN_FUEL_LEVEL) {
                result.eligible = false;
                result.warnings.add("Fuel insuffisant.");
                return result;
            }

            if (fuel >= 60) {
                result.score += 20;
                result.reasons.add("Fuel suffisant.");
            } else {
                result.score += 5;
                result.warnings.add("Fuel moyen.");
            }
        } else {
            result.score -= 5;
            result.warnings.add("Fuel non disponible.");
        }

        Double vehicleLat = vehicle.getCurrentLatitude();
        Double vehicleLng = vehicle.getCurrentLongitude();

        Optional<GpsData> gpsOpt = gpsDataRepository.findTopByVehicleIdOrderByTimestampDesc(vehicle.getId());

        if (gpsOpt.isPresent()) {
            vehicleLat = gpsOpt.get().getLatitude();
            vehicleLng = gpsOpt.get().getLongitude();
        }

        if (vehicleLat != null
                && vehicleLng != null
                && request.getStartLatitude() != null
                && request.getStartLongitude() != null) {

            double distance = distanceKm(
                    vehicleLat,
                    vehicleLng,
                    request.getStartLatitude(),
                    request.getStartLongitude()
            );

            if (distance < 5) {
                result.score += 40;
                result.reasons.add("Véhicule très proche du point de départ.");
            } else if (distance < 20) {
                result.score += 25;
                result.reasons.add("Véhicule proche du point de départ.");
            } else if (distance < 60) {
                result.score += 10;
                result.reasons.add("Véhicule acceptable par distance.");
            } else {
                result.score -= 20;
                result.warnings.add("Véhicule loin du point de départ.");
            }
        } else {
            result.score -= 10;
            result.warnings.add("Position véhicule non disponible.");
        }

        result.eligible = true;
        return result;
    }

    private void validateDailyPlanningRequest(SmartDailyPlanningRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Planning request manquant.");
        }

        if (request.getMissions() == null || request.getMissions().isEmpty()) {
            throw new IllegalArgumentException("La liste des missions est vide.");
        }

        for (DispatchMissionRequest mission : request.getMissions()) {
            validateMissionRequest(mission);
        }
    }

    private void validateMissionRequest(DispatchMissionRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Mission request manquante.");
        }

        if (request.getStartCity() == null || request.getStartCity().isBlank()) {
            throw new IllegalArgumentException("Ville de départ manquante.");
        }

        if (request.getDestinationCity() == null || request.getDestinationCity().isBlank()) {
            throw new IllegalArgumentException("Ville de destination manquante.");
        }

        if (request.getStartTime() == null) {
            throw new IllegalArgumentException("Date début mission manquante.");
        }

        if (request.getExpectedEndTime() == null) {
            throw new IllegalArgumentException("Date fin mission manquante.");
        }

        if (!request.getExpectedEndTime().isAfter(request.getStartTime())) {
            throw new IllegalArgumentException("La date fin doit être après la date début.");
        }

        if (request.getStartTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("La date début ne peut pas être dans le passé.");
        }
    }

    private void validateDailyPlanningInternalOrder(List<DispatchStepDTO> missionSteps) {
        for (int i = 0; i < missionSteps.size(); i++) {
            DispatchStepDTO current = missionSteps.get(i);

            if (current.getStartTime() == null || current.getEndTime() == null) {
                throw new IllegalArgumentException("Date début ou date fin manquante dans le planning.");
            }

            if (!current.getEndTime().isAfter(current.getStartTime())) {
                throw new IllegalArgumentException("Date fin invalide pour mission : " + current.getLabel());
            }

            if (i > 0) {
                DispatchStepDTO previous = missionSteps.get(i - 1);

                long previousDuration = Duration.between(
                        previous.getStartTime(),
                        previous.getEndTime()
                ).toMinutes();

                long requiredRest = calculateRestMinutes(previousDuration);
                LocalDateTime earliestNextStart = previous.getEndTime().plusMinutes(requiredRest);

                if (current.getStartTime().isBefore(earliestNextStart)) {
                    throw new IllegalArgumentException(
                            "Repos driver insuffisant entre : "
                                    + previous.getLabel()
                                    + " et "
                                    + current.getLabel()
                    );
                }
            }
        }
    }

    private void validateVehicleAndDriverNotBusyBeforeCreation(
            Long vehicleId,
            Long driverId,
            List<DispatchStepDTO> missionSteps
    ) {
        if (missionRepository.existsByVehicleIdAndStatus(vehicleId, Mission.MissionStatus.IN_PROGRESS)) {
            throw new IllegalArgumentException("Véhicule déjà en mission.");
        }

        if (missionRepository.existsByDriverIdAndStatus(driverId, Mission.MissionStatus.IN_PROGRESS)) {
            throw new IllegalArgumentException("Driver déjà en mission.");
        }

        for (DispatchStepDTO step : missionSteps) {
            boolean vehicleOverlap = missionRepository.existsVehicleOverlap(
                    vehicleId,
                    step.getStartTime(),
                    step.getEndTime()
            );

            if (vehicleOverlap) {
                throw new IllegalArgumentException(
                        "Véhicule déjà réservé dans cette période : " + step.getLabel()
                );
            }

            boolean driverOverlap = missionRepository.existsDriverOverlap(
                    driverId,
                    step.getStartTime(),
                    step.getEndTime()
            );

            if (driverOverlap) {
                throw new IllegalArgumentException(
                        "Driver déjà réservé dans cette période : " + step.getLabel()
                );
            }
        }
    }

    private long calculateRestMinutes(long missionDurationMinutes) {
        if (missionDurationMinutes < 60) {
            return 10;
        }

        if (missionDurationMinutes <= 180) {
            return 20;
        }

        if (missionDurationMinutes <= 360) {
            return 40;
        }

        return 60;
    }

    private int estimateDurationMinutes(double distanceKm) {
        double averageSpeedKmH = 70.0;
        return Math.max(15, (int) Math.ceil((distanceKm / averageSpeedKmH) * 60));
    }

    private double distanceKm(Double lat1, Double lon1, Double lat2, Double lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return 9999;
        }

        final int earthRadiusKm = 6371;

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2)
                        + Math.cos(Math.toRadians(lat1))
                        * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return earthRadiusKm * c;
    }

    private String fullName(Driver driver) {
        String firstName = driver.getFirstName() != null ? driver.getFirstName() : "";
        String lastName = driver.getLastName() != null ? driver.getLastName() : "";

        String fullName = (firstName + " " + lastName).trim();

        return fullName.isBlank() ? driver.getEmail() : fullName;
    }

    private static class VehicleScore {
        boolean eligible = true;
        int score = 50;
        List<String> reasons = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
    }

    private static class DriverScore {
        boolean eligible = true;
        int score = 50;
        List<String> reasons = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
    }
}