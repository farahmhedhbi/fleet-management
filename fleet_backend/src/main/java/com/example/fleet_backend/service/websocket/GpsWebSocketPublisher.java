package com.example.fleet_backend.service.websocket;

import com.example.fleet_backend.dto.MissionRoutePointDTO;
import com.example.fleet_backend.dto.ObdLiveSocketDTO;
import com.example.fleet_backend.dto.VehicleEventDTO;
import com.example.fleet_backend.dto.VehicleLiveSocketDTO;
import com.example.fleet_backend.dto.VehicleLiveStatusDTO;
import com.example.fleet_backend.model.GpsData;
import com.example.fleet_backend.model.LiveStatus;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.model.VehicleLiveState;
import com.example.fleet_backend.repository.VehicleLiveStateRepository;
import com.example.fleet_backend.service.gps.ActiveMissionContext;
import com.example.fleet_backend.service.gps.GpsMapperService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GpsWebSocketPublisher {

    private final SimpMessagingTemplate messagingTemplate;
    private final VehicleLiveStateRepository vehicleLiveStateRepository;
    private final GpsMapperService gpsMapperService;

    public GpsWebSocketPublisher(SimpMessagingTemplate messagingTemplate,
                                 VehicleLiveStateRepository vehicleLiveStateRepository,
                                 GpsMapperService gpsMapperService) {
        this.messagingTemplate = messagingTemplate;
        this.vehicleLiveStateRepository = vehicleLiveStateRepository;
        this.gpsMapperService = gpsMapperService;
    }

    public void publishLiveUpdate(Vehicle vehicle,
                                  GpsData gpsData,
                                  LiveStatus liveStatus,
                                  ActiveMissionContext context) {

        if (vehicle == null || vehicle.getId() == null || gpsData == null) {
            return;
        }

        VehicleLiveState state = vehicleLiveStateRepository
                .findByVehicleId(vehicle.getId())
                .orElse(null);

        if (state == null) {
            return;
        }

        boolean missionActive = context != null && context.isMissionActive();

        List<MissionRoutePointDTO> missionRoute =
                context != null ? context.getMissionRoute() : List.of();

        VehicleLiveStatusDTO fullDto = gpsMapperService.toVehicleLiveStatusDTO(
                vehicle,
                state,
                missionActive,
                missionRoute
        );

        VehicleLiveSocketDTO liveSocketDto = toLiveSocketDto(fullDto);
        ObdLiveSocketDTO obdSocketDto = toObdSocketDto(state , gpsData);

        // GPS live global léger
        messagingTemplate.convertAndSend("/topic/gps/live", liveSocketDto);

        // GPS live véhicule léger
        messagingTemplate.convertAndSend(
                "/topic/vehicles/" + liveSocketDto.getVehicleId() + "/live",
                liveSocketDto
        );

        // OBD live véhicule léger
        messagingTemplate.convertAndSend(
                "/topic/vehicles/" + liveSocketDto.getVehicleId() + "/obd",
                obdSocketDto
        );

        // GPS live mission léger
        if (liveSocketDto.getMissionId() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/missions/" + liveSocketDto.getMissionId() + "/live",
                    liveSocketDto
            );
        }
    }

    private VehicleLiveSocketDTO toLiveSocketDto(VehicleLiveStatusDTO dto) {
        return new VehicleLiveSocketDTO(
                dto.getVehicleId(),
                dto.getVehicleName(),
                dto.getLatitude(),
                dto.getLongitude(),
                dto.getSpeed(),
                dto.isEngineOn(),
                dto.getTimestamp(),
                dto.getLiveStatus(),
                dto.isMissionActive(),
                dto.getMissionId(),
                dto.getMissionStatus(),
                dto.getRouteSource()
        );
    }

    private ObdLiveSocketDTO toObdSocketDto(VehicleLiveState state, GpsData gpsData) {
        return new ObdLiveSocketDTO(
                state.getVehicle().getId(),
                state.getEngineRpm(),
                state.getFuelLevel(),
                state.getEngineTemperature(),
                state.getBatteryVoltage(),
                state.getEngineLoad(),
                state.getCheckEngineOn(),
                gpsData.isEngineOn(),
                state.getObdStatus(),
                state.getHealthState() != null ? state.getHealthState().name() : null,
                state.getHealthReason(),
                state.getObdLastTimestamp()
        );
    }

    public void publishEvent(VehicleEventDTO dto) {
        if (dto == null) {
            return;
        }

        messagingTemplate.convertAndSend("/topic/events/live", dto);

        if (dto.getVehicleId() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/vehicles/" + dto.getVehicleId() + "/events",
                    dto
            );
        }

        if (dto.getMissionId() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/missions/" + dto.getMissionId() + "/events",
                    dto
            );
        }
    }
}