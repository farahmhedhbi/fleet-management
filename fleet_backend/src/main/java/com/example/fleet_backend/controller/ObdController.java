package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.ObdHistoryDTO;
import com.example.fleet_backend.dto.VehicleObdLiveDTO;
import com.example.fleet_backend.service.ObdHistoryService;
import com.example.fleet_backend.service.ObdLiveService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/obd")
public class ObdController {

    private final ObdHistoryService obdHistoryService;
    private final ObdLiveService obdLiveService;

    public ObdController(ObdHistoryService obdHistoryService,
                         ObdLiveService obdLiveService) {
        this.obdHistoryService = obdHistoryService;
        this.obdLiveService = obdLiveService;
    }

    @GetMapping("/vehicle/{vehicleId}/history")
    public ResponseEntity<List<ObdHistoryDTO>> getVehicleObdHistory(
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

    @GetMapping("/vehicle/{vehicleId}/live")
    public ResponseEntity<VehicleObdLiveDTO> getVehicleObdLive(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(obdLiveService.getVehicleObdLive(vehicleId));
    }
}