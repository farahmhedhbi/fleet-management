package com.example.fleet_backend.service.websocket;

import com.example.fleet_backend.dto.IncidentDTO;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class IncidentWebSocketPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public IncidentWebSocketPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishIncident(IncidentDTO incident) {
        if (incident == null) return;

        messagingTemplate.convertAndSend(
                "/topic/incidents/live",
                incident
        );
    }
}