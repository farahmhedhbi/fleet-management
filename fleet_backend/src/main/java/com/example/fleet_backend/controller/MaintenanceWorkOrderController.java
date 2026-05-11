package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.MaintenanceWorkOrderCreateRequest;
import com.example.fleet_backend.dto.MaintenanceWorkOrderDTO;
import com.example.fleet_backend.dto.MaintenanceWorkOrderStatusRequest;
import com.example.fleet_backend.service.MaintenanceWorkOrderService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance-work-orders")
public class MaintenanceWorkOrderController {

    private final MaintenanceWorkOrderService workOrderService;

    public MaintenanceWorkOrderController(MaintenanceWorkOrderService workOrderService) {
        this.workOrderService = workOrderService;
    }

    @PostMapping
    public MaintenanceWorkOrderDTO create(
            @Valid @RequestBody MaintenanceWorkOrderCreateRequest request,
            Authentication auth
    ) {
        return workOrderService.create(request, auth);
    }

    @GetMapping
    public List<MaintenanceWorkOrderDTO> getAll(Authentication auth) {
        return workOrderService.getAll(auth);
    }

    @GetMapping("/{id}")
    public MaintenanceWorkOrderDTO getById(
            @PathVariable Long id,
            Authentication auth
    ) {
        return workOrderService.getById(id, auth);
    }

    @GetMapping("/vehicle/{vehicleId}")
    public List<MaintenanceWorkOrderDTO> getByVehicle(@PathVariable Long vehicleId) {
        return workOrderService.getByVehicle(vehicleId);
    }

    @PutMapping("/{id}/status")
    public MaintenanceWorkOrderDTO updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody MaintenanceWorkOrderStatusRequest request,
            Authentication auth
    ) {
        return workOrderService.updateStatus(id, request, auth);
    }
}