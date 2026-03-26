package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.GpsDataResponse;
import com.example.fleet_backend.service.GpsDataService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gps")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class GpsController {

    private final GpsDataService gpsDataService;

    public GpsController(GpsDataService gpsDataService) {
        this.gpsDataService = gpsDataService;
    }

    @GetMapping("/vehicle/{id}/last")
    public GpsDataResponse getLastPosition(@PathVariable Long id) {
        return gpsDataService.getLastPosition(id);
    }

    @GetMapping("/vehicle/{id}/history")
    public List<GpsDataResponse> getHistory(@PathVariable Long id) {
        return gpsDataService.getHistory(id);
    }
}