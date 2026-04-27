package com.example.fleet_backend.service.gps;

import com.example.fleet_backend.dto.GpsIncomingDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.GpsData;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.repository.GpsDataRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import com.example.fleet_backend.service.MissionService;
import com.example.fleet_backend.service.ObdEventService;
import com.example.fleet_backend.service.VehicleEventService;
import com.example.fleet_backend.service.VehicleHealthStateService;
import com.example.fleet_backend.service.websocket.GpsWebSocketPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
public class GpsIngestionService {

    private final GpsValidationService gpsValidationService;
    private final VehicleRepository vehicleRepository;
    private final GpsDataRepository gpsDataRepository;
    private final MissionTrackingService missionTrackingService;
    private final GpsStatusService gpsStatusService;
    private final LiveStateService liveStateService;
    private final VehicleEventService vehicleEventService;
    private final ObdEventService obdEventService;
    private final VehicleHealthStateService vehicleHealthStateService;
    private final MissionService missionService;
    private final GpsWebSocketPublisher gpsWebSocketPublisher;

    public GpsIngestionService(GpsValidationService gpsValidationService,
                               VehicleRepository vehicleRepository,
                               GpsDataRepository gpsDataRepository,
                               MissionTrackingService missionTrackingService,
                               GpsStatusService gpsStatusService,
                               LiveStateService liveStateService,
                               VehicleEventService vehicleEventService,
                               ObdEventService obdEventService,
                               VehicleHealthStateService vehicleHealthStateService,
                               MissionService missionService,
                               GpsWebSocketPublisher gpsWebSocketPublisher) {
        this.gpsValidationService = gpsValidationService;
        this.vehicleRepository = vehicleRepository;
        this.gpsDataRepository = gpsDataRepository;
        this.missionTrackingService = missionTrackingService;
        this.gpsStatusService = gpsStatusService;
        this.liveStateService = liveStateService;
        this.vehicleEventService = vehicleEventService;
        this.obdEventService = obdEventService;
        this.vehicleHealthStateService = vehicleHealthStateService;
        this.missionService = missionService;
        this.gpsWebSocketPublisher = gpsWebSocketPublisher;
    }

    public void processIncomingGps(GpsIncomingDTO dto) {
        gpsValidationService.validateIncoming(dto);

        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Vehicle not found with id: " + dto.getVehicleId()
                ));

        ActiveMissionContext context =
                missionTrackingService.getActiveMissionContext(vehicle);

        GpsData previousGps = gpsDataRepository
                .findTopByVehicleIdOrderByTimestampDesc(vehicle.getId())
                .orElse(null);

        GpsData gpsData = buildGpsData(vehicle, dto, context);
        gpsDataRepository.save(gpsData);

        GpsStatusResult statusResult = gpsStatusService.evaluate(
                gpsData,
                context.isMissionActive(),
                context.getMissionRoute()
        );

        String obdStatus = gpsStatusService.computeObdStatus(gpsData);

        VehicleHealthStateService.VehicleHealthDecision healthDecision =
                vehicleHealthStateService.evaluate(
                        gpsData,
                        context.isMissionActive()
                );

        liveStateService.updateLiveState(
                vehicle,
                gpsData,
                statusResult.getLiveStatus(),
                context,
                obdStatus,
                healthDecision.state(),
                healthDecision.reason()
        );

        vehicleEventService.analyzeAndCreateEvents(
                vehicle,
                previousGps,
                gpsData,
                context.isMissionActive(),
                context.getMissionId(),
                statusResult.isOffRoute(),
                statusResult.isMissionCompleted()
        );

        obdEventService.generateEvents(
                gpsData,
                healthDecision.state(),
                healthDecision.reason()
        );

        gpsWebSocketPublisher.publishLiveUpdate(
                vehicle,
                gpsData,
                statusResult.getLiveStatus(),
                context
        );

        if (statusResult.isMissionCompleted() && context.getMission() != null) {
            missionService.completeMissionFromGps(context.getMission());
        }
    }

    private GpsData buildGpsData(Vehicle vehicle,
                                 GpsIncomingDTO dto,
                                 ActiveMissionContext context) {
        GpsData gpsData = new GpsData();

        gpsData.setVehicle(vehicle);
        gpsData.setMissionId(context.getMissionId());

        gpsData.setLatitude(dto.getLatitude());
        gpsData.setLongitude(dto.getLongitude());
        gpsData.setSpeed(dto.getSpeed());
        gpsData.setEngineOn(dto.isEngineOn());
        gpsData.setTimestamp(
                dto.getTimestamp() != null ? dto.getTimestamp() : LocalDateTime.now()
        );

        gpsData.setRouteId(normalizeRouteId(dto.getRouteId()));
        gpsData.setRouteSource(normalizeRouteSource(dto.getRouteSource()));

        gpsData.setEngineRpm(dto.getEngineRpm());
        gpsData.setFuelLevel(dto.getFuelLevel());
        gpsData.setEngineTemperature(dto.getEngineTemperature());
        gpsData.setBatteryVoltage(dto.getBatteryVoltage());
        gpsData.setEngineLoad(dto.getEngineLoad());
        gpsData.setCheckEngineOn(dto.getCheckEngineOn());

        return gpsData;
    }

    private String normalizeRouteId(String routeId) {
        return routeId == null || routeId.isBlank() ? null : routeId.trim();
    }

    private String normalizeRouteSource(String routeSource) {
        if (routeSource == null || routeSource.isBlank()) {
            return null;
        }

        return routeSource.trim().toUpperCase();
    }
}