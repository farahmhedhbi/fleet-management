package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.ObdHistoryDTO;
import com.example.fleet_backend.dto.ObdIngestRequest;
import com.example.fleet_backend.dto.VehicleObdLiveDTO;
import com.example.fleet_backend.service.ObdHistoryService;
import com.example.fleet_backend.service.ObdIngestService;
import com.example.fleet_backend.service.TelemetryProcessingService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/obd")
public class ObdController {

    private final TelemetryProcessingService telemetryProcessingService;
    private final ObdHistoryService obdHistoryService;
    private final ObdIngestService obdIngestService;

    public ObdController(TelemetryProcessingService telemetryProcessingService, ObdIngestService obdIngestService , ObdHistoryService obdHistoryService) {
        this.telemetryProcessingService = telemetryProcessingService;
        this.obdHistoryService = obdHistoryService;
        this.obdIngestService = obdIngestService;
    }

    @GetMapping("/vehicle/{vehicleId}/live")
    public VehicleObdLiveDTO getVehicleObdLive(@PathVariable Long vehicleId) {
        return telemetryProcessingService.getVehicleObdLive(vehicleId);
    }

    @PostMapping("/ingest")
    public ResponseEntity<?> ingest(@RequestBody ObdIngestRequest request) {
        obdIngestService.ingest(request);
        return ResponseEntity.ok("OBD data saved");
    }

    @GetMapping("/vehicle/{vehicleId}/history")
    public ResponseEntity<List<ObdHistoryDTO>> getVehicleHistory(
            @PathVariable Long vehicleId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime to
    ) {
        return ResponseEntity.ok(obdHistoryService.getVehicleHistory(vehicleId, from, to));
    }
}