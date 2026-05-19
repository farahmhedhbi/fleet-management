package com.example.fleet_backend.websocket;

import com.example.fleet_backend.dto.ReturnDepotDTO;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class ReturnDepotWebSocketPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public ReturnDepotWebSocketPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publish(ReturnDepotDTO dto) {
        messagingTemplate.convertAndSend("/topic/return-depot/live", dto);

        if (dto.getVehicleId() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/vehicles/" + dto.getVehicleId() + "/return-depot",
                    dto
            );
        }

        if (dto.getMissionId() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/missions/" + dto.getMissionId() + "/return-depot",
                    dto
            );
        }
    }
}