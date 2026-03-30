package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.VehicleEventDTO;
import com.example.fleet_backend.service.VehicleEventService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class VehicleEventController {

    private final VehicleEventService vehicleEventService;

    public VehicleEventController(VehicleEventService vehicleEventService) {
        this.vehicleEventService = vehicleEventService;
    }

    @GetMapping("/live")
    public ResponseEntity<List<VehicleEventDTO>> getLatestEvents() {
        return ResponseEntity.ok(vehicleEventService.getLatestEvents());
    }

    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<VehicleEventDTO>> getVehicleEvents(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(vehicleEventService.getVehicleEvents(vehicleId));
    }
}