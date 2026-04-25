package com.example.fleet_backend.service.websocket;

import com.example.fleet_backend.dto.MissionRoutePointDTO;
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

        VehicleLiveState state = vehicleLiveStateRepository.findByVehicleId(vehicle.getId())
                .orElse(null);

        if (state == null) {
            return;
        }

        List<MissionRoutePointDTO> missionRoute =
                context != null ? context.getMissionRoute() : List.of();

        boolean missionActive =
                context != null && context.isMissionActive();

        VehicleLiveStatusDTO dto = gpsMapperService.toVehicleLiveStatusDTO(
                vehicle,
                state,
                missionActive,
                missionRoute
        );

        messagingTemplate.convertAndSend("/topic/gps/live", dto);

        if (context != null && context.getMissionId() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/missions/" + context.getMissionId() + "/live",
                    dto
            );
        }
    }
}