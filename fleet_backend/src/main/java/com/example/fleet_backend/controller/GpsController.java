package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.GpsPointDTO;
import com.example.fleet_backend.dto.VehicleLiveStatusDTO;
import com.example.fleet_backend.service.GpsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/gps")
@CrossOrigin(origins = "*")
public class GpsController {

    private final GpsService gpsService;

    public GpsController(GpsService gpsService) {
        this.gpsService = gpsService;
    }

    @GetMapping("/live")
    public ResponseEntity<List<VehicleLiveStatusDTO>> getLiveFleet() {
        return ResponseEntity.ok(gpsService.getLiveFleet());
    }

    @GetMapping("/vehicle/{id}/last")
    public ResponseEntity<GpsPointDTO> getLastPosition(@PathVariable Long id) {
        Optional<GpsPointDTO> gpsData = gpsService.getLastPosition(id);
        return gpsData.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/vehicle/{id}/history")
    public ResponseEntity<List<GpsPointDTO>> getHistory(@PathVariable Long id) {
        return ResponseEntity.ok(gpsService.getHistory(id));
    }
}