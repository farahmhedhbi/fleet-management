package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.ReturnDepotDTO;
import com.example.fleet_backend.service.ReturnDepotService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/return-depot")
public class ReturnDepotController {

    private final ReturnDepotService returnDepotService;

    public ReturnDepotController(ReturnDepotService returnDepotService) {
        this.returnDepotService = returnDepotService;
    }

    @PostMapping("/mission/{missionId}/suggest")
    public ReturnDepotDTO suggest(@PathVariable Long missionId) {
        return returnDepotService.suggestReturnDepot(missionId);
    }

    @PostMapping("/{requestId}/accept")
    public ReturnDepotDTO accept(@PathVariable Long requestId) {
        return returnDepotService.acceptReturnDepot(requestId);
    }

    @PostMapping("/{requestId}/reject")
    public ReturnDepotDTO reject(@PathVariable Long requestId) {
        return returnDepotService.rejectReturnDepot(requestId);
    }
}