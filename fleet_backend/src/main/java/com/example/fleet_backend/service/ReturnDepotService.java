package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.ReturnDepotDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.model.ReturnDepotRequest;
import com.example.fleet_backend.model.ReturnDepotStatus;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.repository.MissionRepository;
import com.example.fleet_backend.repository.ReturnDepotRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import com.example.fleet_backend.websocket.ReturnDepotWebSocketPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
public class ReturnDepotService {

    private static final double ARRIVAL_DISTANCE_METERS = 100.0;

    private final ReturnDepotRepository returnDepotRepository;
    private final MissionRepository missionRepository;
    private final VehicleRepository vehicleRepository;
    private final ReturnDepotWebSocketPublisher publisher;

    public ReturnDepotService(
            ReturnDepotRepository returnDepotRepository,
            MissionRepository missionRepository,
            VehicleRepository vehicleRepository,
            ReturnDepotWebSocketPublisher publisher
    ) {
        this.returnDepotRepository = returnDepotRepository;
        this.missionRepository = missionRepository;
        this.vehicleRepository = vehicleRepository;
        this.publisher = publisher;
    }

    public ReturnDepotDTO suggestReturnDepot(Long missionId) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResourceNotFoundException("Mission not found"));

        Vehicle vehicle = mission.getVehicle();

        if (vehicle == null) {
            throw new IllegalArgumentException("Mission vehicle is missing");
        }

        if (vehicle.getHomeDepotLatitude() == null || vehicle.getHomeDepotLongitude() == null) {
            throw new IllegalArgumentException("Vehicle depot location is missing");
        }

        vehicle.setStatus(Vehicle.VehicleStatus.OUTSIDE_DEPOT);
        vehicle.setParked(false);
        vehicleRepository.save(vehicle);

        ReturnDepotRequest request = new ReturnDepotRequest();
        request.setMissionId(mission.getId());
        request.setVehicleId(vehicle.getId());
        request.setDriverId(mission.getDriver() != null ? mission.getDriver().getId() : null);

        request.setDepotLatitude(vehicle.getHomeDepotLatitude());
        request.setDepotLongitude(vehicle.getHomeDepotLongitude());

        request.setCurrentLatitude(vehicle.getCurrentLatitude());
        request.setCurrentLongitude(vehicle.getCurrentLongitude());

        double distance = 0.0;

        if (vehicle.getCurrentLatitude() != null && vehicle.getCurrentLongitude() != null) {
            distance = distanceMeters(
                    vehicle.getCurrentLatitude(),
                    vehicle.getCurrentLongitude(),
                    vehicle.getHomeDepotLatitude(),
                    vehicle.getHomeDepotLongitude()
            );
        }

        request.setDistanceMeters(distance);
        request.setEtaMinutes(estimateEtaMinutes(distance));
        request.setStatus(ReturnDepotStatus.SUGGESTED);

        ReturnDepotRequest saved = returnDepotRepository.save(request);
        publish(saved);

        return new ReturnDepotDTO(saved);
    }

    public ReturnDepotDTO acceptReturnDepot(Long requestId) {
        ReturnDepotRequest request = returnDepotRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Return depot request not found"));

        if (request.getStatus() != ReturnDepotStatus.SUGGESTED) {
            throw new IllegalArgumentException("Only suggested return depot can be accepted");
        }

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        request.setStatus(ReturnDepotStatus.IN_PROGRESS);
        request.setAcceptedAt(LocalDateTime.now());
        request.setStartedAt(LocalDateTime.now());

        vehicle.setStatus(Vehicle.VehicleStatus.RETURNING_TO_DEPOT);
        vehicle.setParked(false);
        vehicleRepository.save(vehicle);

        ReturnDepotRequest saved = returnDepotRepository.save(request);
        publish(saved);

        return new ReturnDepotDTO(saved);
    }

    public ReturnDepotDTO rejectReturnDepot(Long requestId) {
        ReturnDepotRequest request = returnDepotRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Return depot request not found"));

        if (request.getStatus() != ReturnDepotStatus.SUGGESTED) {
            throw new IllegalArgumentException("Only suggested return depot can be rejected");
        }

        request.setStatus(ReturnDepotStatus.REJECTED);

        ReturnDepotRequest saved = returnDepotRepository.save(request);
        publish(saved);

        return new ReturnDepotDTO(saved);
    }

    public ReturnDepotDTO checkArrival(Long vehicleId, Double latitude, Double longitude) {
        if (vehicleId == null || latitude == null || longitude == null) {
            return null;
        }

        ReturnDepotRequest request = returnDepotRepository
                .findTopByVehicleIdAndStatusOrderBySuggestedAtDesc(
                        vehicleId,
                        ReturnDepotStatus.IN_PROGRESS
                )
                .orElse(null);

        if (request == null) {
            return null;
        }

        if (request.getDepotLatitude() == null || request.getDepotLongitude() == null) {
            return null;
        }

        double distance = distanceMeters(
                latitude,
                longitude,
                request.getDepotLatitude(),
                request.getDepotLongitude()
        );

        request.setCurrentLatitude(latitude);
        request.setCurrentLongitude(longitude);
        request.setDistanceMeters(distance);
        request.setEtaMinutes(estimateEtaMinutes(distance));

        if (distance <= ARRIVAL_DISTANCE_METERS) {
            Vehicle vehicle = vehicleRepository.findById(vehicleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

            request.setStatus(ReturnDepotStatus.ARRIVED);
            request.setArrivedAt(LocalDateTime.now());

            vehicle.setStatus(Vehicle.VehicleStatus.AVAILABLE);
            vehicle.setParked(true);
            vehicle.setCurrentLatitude(latitude);
            vehicle.setCurrentLongitude(longitude);

            if (vehicle.getHomeDepotCity() != null) {
                vehicle.setCurrentCity(vehicle.getHomeDepotCity());
            }

            vehicleRepository.save(vehicle);
        }

        ReturnDepotRequest saved = returnDepotRepository.save(request);
        publish(saved);

        return new ReturnDepotDTO(saved);
    }

    private void publish(ReturnDepotRequest request) {
        publisher.publish(new ReturnDepotDTO(request));
    }

    private int estimateEtaMinutes(double distanceMeters) {
        double averageMetersPerMinute = 600.0;
        return Math.max(1, (int) Math.ceil(distanceMeters / averageMetersPerMinute));
    }

    private double distanceMeters(
            double lat1,
            double lon1,
            double lat2,
            double lon2
    ) {
        double earthRadius = 6371000.0;

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