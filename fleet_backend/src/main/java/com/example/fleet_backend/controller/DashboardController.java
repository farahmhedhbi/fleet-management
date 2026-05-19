package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.DashboardKpiDTO;
import com.example.fleet_backend.security.AuthUtil;
import com.example.fleet_backend.service.DashboardKpiService;
import com.example.fleet_backend.websocket.DashboardWebSocketPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/owner/dashboard")
public class DashboardController {

    private final DashboardKpiService dashboardKpiService;
    private final DashboardWebSocketPublisher dashboardWebSocketPublisher;

    public DashboardController(
            DashboardKpiService dashboardKpiService,
            DashboardWebSocketPublisher dashboardWebSocketPublisher
    ) {
        this.dashboardKpiService = dashboardKpiService;
        this.dashboardWebSocketPublisher = dashboardWebSocketPublisher;
    }

    @GetMapping("/kpi")
    public DashboardKpiDTO getKpi(Authentication authentication) {
        Long ownerId = AuthUtil.userId(authentication);
        return dashboardKpiService.getOwnerKpi(ownerId);
    }

    @PostMapping("/kpi/publish")
    public void publishKpi(Authentication authentication) {
        Long ownerId = AuthUtil.userId(authentication);
        dashboardWebSocketPublisher.publishOwnerKpi(ownerId);
    }
}