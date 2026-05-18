package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.DispatchMissionRequest;
import com.example.fleet_backend.dto.DispatchStepDTO;
import com.example.fleet_backend.dto.DispatchSuggestionDTO;
import com.example.fleet_backend.dto.SmartAssignmentRequest;
import com.example.fleet_backend.model.*;
import com.example.fleet_backend.repository.*;
import com.example.fleet_backend.security.AuthUtil;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class SmartDispatchService {

    private static final double MIN_FUEL_LEVEL = 15.0;

    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final GpsDataRepository gpsDataRepository;
    private final MissionRepository missionRepository;
    private final IncidentRepository incidentRepository;
    private final MaintenanceRepository maintenanceRepository;

    public SmartDispatchService(
            VehicleRepository vehicleRepository,
            DriverRepository driverRepository,
            GpsDataRepository gpsDataRepository,
            MissionRepository missionRepository,
            IncidentRepository incidentRepository,
            MaintenanceRepository maintenanceRepository
    ) {
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
        this.gpsDataRepository = gpsDataRepository;
        this.missionRepository = missionRepository;
        this.incidentRepository = incidentRepository;
        this.maintenanceRepository = maintenanceRepository;
    }

    @Transactional(readOnly = true)
    public DispatchSuggestionDTO smartAssignment(
            SmartAssignmentRequest request,
            Authentication auth
    ) {
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
                    bestReasons.addAll(vehicleScore.reasons);
                    bestReasons.addAll(driverScore.reasons);

                    bestWarnings = new ArrayList<>();
                    bestWarnings.addAll(vehicleScore.warnings);
                    bestWarnings.addAll(driverScore.warnings);
                }
            }
        }

        if (bestVehicle == null || bestDriver == null) {
            throw new IllegalArgumentException(
                    "Aucune combinaison véhicule/driver disponible pour cette mission."
            );
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
        step.setDurationMinutes(
                (int) Duration.between(
                        request.getStartTime(),
                        request.getExpectedEndTime()
                ).toMinutes()
        );

        dto.getSteps().add(step);

        return dto;
    }

    private VehicleScore scoreVehicle(
            Vehicle vehicle,
            DispatchMissionRequest request
    ) {
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

        /*
         * Important:
         * IN_USE / RESERVED ne bloque pas automatiquement.
         * Si le véhicule est en mission maintenant mais libre à l'heure demandée,
         * il reste éligible.
         */

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

        Optional<GpsData> gpsOpt =
                gpsDataRepository.findTopByVehicleIdOrderByTimestampDesc(vehicle.getId());

        if (gpsOpt.isPresent()) {
            GpsData lastGps = gpsOpt.get();

            vehicleLat = lastGps.getLatitude();
            vehicleLng = lastGps.getLongitude();

            if (lastGps.getTimestamp() != null) {
                long gpsAgeMinutes = Duration.between(
                        lastGps.getTimestamp(),
                        LocalDateTime.now()
                ).toMinutes();

                if (gpsAgeMinutes <= 2) {
                    result.score += 20;
                    result.reasons.add("Position GPS temps réel très récente.");
                } else if (gpsAgeMinutes <= 5) {
                    result.score += 10;
                    result.reasons.add("Position GPS récente.");
                } else if (gpsAgeMinutes <= 15) {
                    result.score -= 15;
                    result.warnings.add("Position GPS un peu ancienne.");
                } else {
                    result.score -= 40;
                    result.warnings.add("Position GPS non fiable ou trop ancienne.");
                }
            } else {
                result.score -= 20;
                result.warnings.add("Timestamp GPS manquant.");
            }

            if (lastGps.getSpeed() != null && lastGps.getSpeed() > 0) {
                result.score += 5;
                result.reasons.add("Véhicule en mouvement récemment.");
            }
        } else {
            result.score -= 30;
            result.warnings.add("Aucune position GPS trouvée pour ce véhicule.");
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
            result.warnings.add("Position véhicule ou position départ non disponible.");
        }

        result.eligible = true;
        return result;
    }

    private DriverScore scoreDriver(
            Driver driver,
            DispatchMissionRequest request
    ) {
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
                || driver.getStatus() == Driver.DriverStatus.ON_LEAVE) {

            result.eligible = false;
            result.warnings.add("Driver non disponible.");
            return result;
        }

        if (driver.getLicenseExpiry() == null) {
            result.eligible = false;
            result.warnings.add("Date d'expiration du permis manquante.");
            return result;
        }

        if (!driver.getLicenseExpiry().isAfter(request.getExpectedEndTime())) {
            result.eligible = false;
            result.warnings.add("Permis expiré avant la fin de la mission.");
            return result;
        }

        if (driver.getStatus() == Driver.DriverStatus.RESTING
                && driver.getAvailableAt() != null
                && driver.getAvailableAt().isAfter(request.getStartTime())) {

            result.eligible = false;
            result.warnings.add("Driver en repos jusqu'à " + driver.getAvailableAt());
            return result;
        }

        /*
         * Important:
         * ON_MISSION / RESERVED ne bloque pas automatiquement.
         * Si le driver est en mission maintenant mais libre à l'heure demandée,
         * il reste éligible.
         */

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

        Optional<Mission> lastMissionOpt =
                missionRepository.findTopByDriverIdOrderByEndDateDesc(driver.getId());

        if (lastMissionOpt.isPresent()) {
            Mission lastMission = lastMissionOpt.get();

            if (lastMission.getStartDate() != null && lastMission.getEndDate() != null) {
                long lastMissionDuration = Duration.between(
                        lastMission.getStartDate(),
                        lastMission.getEndDate()
                ).toMinutes();

                long requiredRest = calculateRestMinutes(lastMissionDuration);

                LocalDateTime requiredAvailableAt =
                        lastMission.getEndDate().plusMinutes(requiredRest);

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

    private long calculateRestMinutes(long missionDurationMinutes) {
        if (missionDurationMinutes < 60) {
            return 0;
        }

        if (missionDurationMinutes <= 120) {
            return 15;
        }

        return 30;
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