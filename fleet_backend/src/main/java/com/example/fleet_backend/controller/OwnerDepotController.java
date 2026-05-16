package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.CreateDepotRequest;
import com.example.fleet_backend.dto.DepotVehicleDTO;
import com.example.fleet_backend.dto.OwnerDepotDTO;
import com.example.fleet_backend.service.OwnerDepotService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/owner/depot")
public class OwnerDepotController {

    private final OwnerDepotService ownerDepotService;

    public OwnerDepotController(OwnerDepotService ownerDepotService) {
        this.ownerDepotService = ownerDepotService;
    }

    @PostMapping
    public OwnerDepotDTO createDepot(
            @RequestBody CreateDepotRequest request,
            Authentication auth
    ) {
        return ownerDepotService.createDepot(request, auth);
    }

    @PostMapping("/disable")
    public void disableDepot(Authentication auth) {
        ownerDepotService.disableDepot(auth);
    }

    @GetMapping
    public OwnerDepotDTO getDepot(Authentication auth) {
        return ownerDepotService.getOwnerDepot(auth);
    }

    @GetMapping("/vehicles")
    public List<DepotVehicleDTO> getVehicles(Authentication auth) {
        return ownerDepotService.getDepotVehicles(auth);
    }
}