package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.DispatchSuggestionDTO;
import com.example.fleet_backend.service.DriverReturnDepotService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/driver/missions")
public class DriverReturnDepotController {

    private final DriverReturnDepotService driverReturnDepotService;

    public DriverReturnDepotController(DriverReturnDepotService driverReturnDepotService) {
        this.driverReturnDepotService = driverReturnDepotService;
    }

    @PostMapping("/{missionId}/return-depot")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<DispatchSuggestionDTO> returnToDepot(
            @PathVariable Long missionId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                driverReturnDepotService.requestReturnToDepot(missionId, authentication)
        );
    }
}