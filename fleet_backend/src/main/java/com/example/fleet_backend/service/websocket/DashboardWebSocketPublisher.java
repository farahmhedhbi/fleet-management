package com.example.fleet_backend.websocket;

import com.example.fleet_backend.dto.DashboardKpiDTO;
import com.example.fleet_backend.service.DashboardKpiService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class DashboardWebSocketPublisher {

    private final SimpMessagingTemplate messagingTemplate;
    private final DashboardKpiService dashboardKpiService;

    public DashboardWebSocketPublisher(
            SimpMessagingTemplate messagingTemplate,
            DashboardKpiService dashboardKpiService
    ) {
        this.messagingTemplate = messagingTemplate;
        this.dashboardKpiService = dashboardKpiService;
    }

    public void publishOwnerKpi(Long ownerId) {
        if (ownerId == null) return;

        DashboardKpiDTO dto = dashboardKpiService.getOwnerKpi(ownerId);

        messagingTemplate.convertAndSend(
                "/topic/owners/" + ownerId + "/dashboard/kpi",
                dto
        );
    }
}