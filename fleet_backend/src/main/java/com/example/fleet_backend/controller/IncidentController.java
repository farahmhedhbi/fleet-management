package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.IncidentCreateRequest;
import com.example.fleet_backend.dto.IncidentDTO;
import com.example.fleet_backend.dto.IncidentUpdateStatusRequest;
import com.example.fleet_backend.service.IncidentService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @PostMapping
    public IncidentDTO createIncident(
            @Valid @RequestBody IncidentCreateRequest request,
            Authentication auth
    ) {
        return incidentService.createManualIncident(request, auth);
    }

    @GetMapping
    public List<IncidentDTO> getLatestIncidents(Authentication auth) {
        return incidentService.getLatestIncidents(auth);
    }

    @GetMapping("/{id}")
    public IncidentDTO getIncidentById(
            @PathVariable Long id,
            Authentication auth
    ) {
        return incidentService.getIncidentById(id, auth);
    }

    @GetMapping("/vehicle/{vehicleId}")
    public List<IncidentDTO> getIncidentsByVehicle(@PathVariable Long vehicleId) {
        return incidentService.getIncidentsByVehicle(vehicleId);
    }

    @GetMapping("/mission/{missionId}")
    public List<IncidentDTO> getIncidentsByMission(@PathVariable Long missionId) {
        return incidentService.getIncidentsByMission(missionId);
    }

    @PutMapping("/{id}/status")
    public IncidentDTO updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody IncidentUpdateStatusRequest request,
            Authentication auth
    ) {
        return incidentService.updateStatus(id, request, auth);
    }
}