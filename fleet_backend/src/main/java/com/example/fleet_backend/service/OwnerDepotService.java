package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.CreateDepotRequest;
import com.example.fleet_backend.dto.DepotVehicleDTO;
import com.example.fleet_backend.dto.OwnerDepotDTO;
import com.example.fleet_backend.model.*;
import com.example.fleet_backend.repository.*;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class OwnerDepotService {

    private final OwnerDepotRepository ownerDepotRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final GpsDataRepository gpsDataRepository;
    private final MissionRepository missionRepository;

    public OwnerDepotService(
            OwnerDepotRepository ownerDepotRepository,
            UserRepository userRepository,
            VehicleRepository vehicleRepository,
            GpsDataRepository gpsDataRepository,
            MissionRepository missionRepository
    ) {
        this.ownerDepotRepository = ownerDepotRepository;
        this.userRepository = userRepository;
        this.vehicleRepository = vehicleRepository;
        this.gpsDataRepository = gpsDataRepository;
        this.missionRepository = missionRepository;
    }

    public OwnerDepotDTO createDepot(CreateDepotRequest request, Authentication auth) {

        User owner = getCurrentOwner(auth);

        OwnerDepot depot = ownerDepotRepository
                .findByOwnerId(owner.getId())
                .orElse(new OwnerDepot());

        depot.setOwner(owner);
        depot.setEnabled(true);
        depot.setName(request.getName());
        depot.setCity(request.getCity());
        depot.setAddress(request.getAddress());
        depot.setLatitude(request.getLatitude());
        depot.setLongitude(request.getLongitude());
        depot.setRadiusMeters(request.getRadiusMeters() != null ? request.getRadiusMeters() : 100);

        OwnerDepot saved = ownerDepotRepository.save(depot);
        return new OwnerDepotDTO(saved);
    }

    public void disableDepot(Authentication auth) {
        OwnerDepot depot = getOwnerDepotEntity(auth);

        if (depot == null) {
            return;
        }

        depot.setEnabled(false);
        ownerDepotRepository.save(depot);
    }

    public OwnerDepotDTO getOwnerDepot(Authentication auth) {
        OwnerDepot depot = getOwnerDepotEntity(auth);

        if (depot == null) {
            return null;
        }

        return new OwnerDepotDTO(depot);
    }

    private OwnerDepot getOwnerDepotEntity(Authentication auth) {
        User owner = getCurrentOwner(auth);

        return ownerDepotRepository
                .findByOwnerId(owner.getId())
                .orElse(null);
    }

    public List<DepotVehicleDTO> getDepotVehicles(Authentication auth) {

        OwnerDepot depot = getOwnerDepotEntity(auth);

        if (depot == null || Boolean.FALSE.equals(depot.getEnabled())) {
            return List.of();
        }

        List<Vehicle> vehicles = vehicleRepository.findByOwnerId(depot.getOwner().getId());

        List<DepotVehicleDTO> result = new ArrayList<>();

        for (Vehicle vehicle : vehicles) {

            DepotVehicleDTO dto = new DepotVehicleDTO();

            dto.setVehicleId(vehicle.getId());
            dto.setPlateNumber(vehicle.getRegistrationNumber());

            GpsData gps = gpsDataRepository
                    .findTopByVehicleIdOrderByTimestampDesc(vehicle.getId())
                    .orElse(null);

            if (gps == null) {
                dto.setStatus(DepotVehicleStatus.NO_GPS);
                result.add(dto);
                continue;
            }

            dto.setLatitude(gps.getLatitude());
            dto.setLongitude(gps.getLongitude());

            double distanceKm = distanceKm(
                    depot.getLatitude(),
                    depot.getLongitude(),
                    gps.getLatitude(),
                    gps.getLongitude()
            );

            dto.setDistanceFromDepotKm(distanceKm);

            boolean onMission = missionRepository.existsByVehicleIdAndStatus(
                    vehicle.getId(),
                    Mission.MissionStatus.IN_PROGRESS
            );

            if (onMission) {
                dto.setStatus(DepotVehicleStatus.ON_MISSION);
            } else if (distanceKm * 1000 <= depot.getRadiusMeters()) {
                dto.setStatus(DepotVehicleStatus.PARKED);
            } else {
                dto.setStatus(DepotVehicleStatus.OUTSIDE_DEPOT);
            }

            result.add(dto);
        }

        return result;
    }

    private User getCurrentOwner(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("User not authenticated");
        }

        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Owner not found"));
    }

    private double distanceKm(double lat1, double lon1, double lat2, double lon2) {
        double earthRadius = 6371;

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2)
                        + Math.cos(Math.toRadians(lat1))
                        * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLon / 2)
                        * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return earthRadius * c;
    }
}