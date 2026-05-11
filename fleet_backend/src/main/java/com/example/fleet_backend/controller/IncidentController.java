package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.IncidentCreateRequest;
import com.example.fleet_backend.dto.IncidentDTO;
import com.example.fleet_backend.dto.IncidentFromEventRequest;
import com.example.fleet_backend.dto.IncidentUpdateStatusRequest;
import com.example.fleet_backend.service.IncidentService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.example.fleet_backend.dto.IncidentHistoryDTO;

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

    @PostMapping(value = "/with-photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public IncidentDTO createIncidentWithPhotos(
            @Valid @RequestPart("data") IncidentCreateRequest request,
            @RequestPart(value = "photos", required = false) List<MultipartFile> photos,
            Authentication auth
    ) {
        return incidentService.createManualIncidentWithPhotos(request, photos, auth);
    }

    @PostMapping("/from-event")
    public IncidentDTO confirmEventAsIncident(
            @Valid @RequestBody IncidentFromEventRequest request,
            Authentication auth
    ) {
        return incidentService.confirmEventAsIncident(request, auth);
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

    @GetMapping("/me")
    public List<IncidentDTO> getMyIncidents(Authentication auth) {
        return incidentService.getMyIncidents(auth);
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
    @GetMapping("/{id}/history")
    public List<IncidentHistoryDTO> getIncidentHistory(
            @PathVariable Long id,
            Authentication auth
    ) {
        return incidentService.getIncidentHistory(id, auth);
    }
    @GetMapping("/history")
    public List<IncidentHistoryDTO> getLatestIncidentHistories(Authentication auth) {
        return incidentService.getLatestIncidentHistories(auth);
    }
}