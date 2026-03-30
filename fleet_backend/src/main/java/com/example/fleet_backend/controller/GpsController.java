package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.GpsIncomingDTO;
import com.example.fleet_backend.dto.GpsPointDTO;
import com.example.fleet_backend.dto.VehicleLiveStatusDTO;
import com.example.fleet_backend.service.GpsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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

    @PostMapping("/ingest")
    public ResponseEntity<Void> ingest(@RequestBody GpsIncomingDTO dto) {
        gpsService.processIncomingGps(dto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/live")
    public ResponseEntity<List<VehicleLiveStatusDTO>> getLiveFleet(Authentication auth) {
        return ResponseEntity.ok(gpsService.getLiveFleetSecured(auth));
    }

    @GetMapping("/vehicle/{id}/last")
    public ResponseEntity<GpsPointDTO> getLastPosition(@PathVariable Long id, Authentication auth) {
        Optional<GpsPointDTO> gpsData = gpsService.getLastPositionSecured(id, auth);
        return gpsData.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/vehicle/{id}/history")
    public ResponseEntity<List<GpsPointDTO>> getHistory(@PathVariable Long id,
                                                        @RequestParam(required = false)
                                                        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                                                        LocalDateTime from,
                                                        @RequestParam(required = false)
                                                        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                                                        LocalDateTime to,
                                                        Authentication auth) {
        if (from != null && to != null) {
            return ResponseEntity.ok(gpsService.getHistoryRangeSecured(id, from, to, auth));
        }

        return ResponseEntity.ok(gpsService.getHistorySecured(id, auth));
    }
}