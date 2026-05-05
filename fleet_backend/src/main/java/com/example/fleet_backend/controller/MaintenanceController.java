package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.MaintenanceCreateRequest;
import com.example.fleet_backend.dto.MaintenanceDTO;
import com.example.fleet_backend.dto.MaintenanceUpdateStatusRequest;
import com.example.fleet_backend.model.MaintenanceStatus;
import com.example.fleet_backend.service.MaintenanceService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenances")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    public MaintenanceController(MaintenanceService maintenanceService) {
        this.maintenanceService = maintenanceService;
    }

    @PostMapping
    public MaintenanceDTO createMaintenance(
            @Valid @RequestBody MaintenanceCreateRequest request,
            Authentication auth
    ) {
        return maintenanceService.createMaintenance(request, auth);
    }

    @GetMapping
    public List<MaintenanceDTO> getLatestMaintenances(Authentication auth) {
        return maintenanceService.getLatestMaintenances(auth);
    }

    @GetMapping("/{id}")
    public MaintenanceDTO getMaintenanceById(
            @PathVariable Long id,
            Authentication auth
    ) {
        return maintenanceService.getMaintenanceById(id, auth);
    }

    @GetMapping("/vehicle/{vehicleId}")
    public List<MaintenanceDTO> getMaintenancesByVehicle(
            @PathVariable Long vehicleId
    ) {
        return maintenanceService.getMaintenancesByVehicle(vehicleId);
    }

    @GetMapping("/status/{status}")
    public List<MaintenanceDTO> getMaintenancesByStatus(
            @PathVariable MaintenanceStatus status,
            Authentication auth
    ) {
        return maintenanceService.getMaintenancesByStatus(status, auth);
    }

    @GetMapping("/upcoming")
    public List<MaintenanceDTO> getUpcomingMaintenances(Authentication auth) {
        return maintenanceService.getUpcomingMaintenances(auth);
    }

    @PutMapping("/{id}/status")
    public MaintenanceDTO updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody MaintenanceUpdateStatusRequest request,
            Authentication auth
    ) {
        return maintenanceService.updateStatus(id, request, auth);
    }

    @PutMapping("/{id}/cancel")
    public MaintenanceDTO cancelMaintenance(
            @PathVariable Long id,
            Authentication auth
    ) {
        return maintenanceService.cancelMaintenance(id, auth);
    }
}