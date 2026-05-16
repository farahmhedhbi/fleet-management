package com.example.fleet_backend.service.websocket;

import com.example.fleet_backend.dto.RouteCheckResultDTO;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class RouteCheckWebSocketPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public RouteCheckWebSocketPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publish(RouteCheckResultDTO dto) {
        if (dto == null || dto.getMissionId() == null) return;

        messagingTemplate.convertAndSend(
                "/topic/missions/" + dto.getMissionId() + "/route-check",
                dto
        );

        if (dto.getVehicleId() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/vehicles/" + dto.getVehicleId() + "/route-check",
                    dto
            );
        }
    }
}