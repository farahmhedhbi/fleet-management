package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.GpsPointDTO;
import com.example.fleet_backend.dto.MissionDTO;
import com.example.fleet_backend.dto.VehicleLiveStatusDTO;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.service.GpsService;
import com.example.fleet_backend.service.MissionService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/missions")
@CrossOrigin(origins = "*")
public class MissionController {

    private final MissionService missionService;
    private final GpsService gpsService;

    public MissionController(MissionService missionService, GpsService gpsService) {
        this.missionService = missionService;
        this.gpsService = gpsService;
    }

    @GetMapping
    public ResponseEntity<List<MissionDTO>> getAll(Authentication auth) {
        return ResponseEntity.ok(missionService.getMissions(auth));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MissionDTO> getById(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(missionService.getMissionById(id, auth));
    }

    @GetMapping("/{id}/live")
    public ResponseEntity<VehicleLiveStatusDTO> getMissionLive(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(gpsService.getMissionLiveSecured(id, auth));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<GpsPointDTO>> getMissionHistory(
            @PathVariable Long id,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime to,
            Authentication auth
    ) {
        return ResponseEntity.ok(gpsService.getMissionHistorySecured(id, from, to, auth));
    }

    @PostMapping
    public ResponseEntity<MissionDTO> create(@Valid @RequestBody MissionDTO dto, Authentication auth) {
        return ResponseEntity.ok(missionService.createMission(dto, auth));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<MissionDTO> start(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(missionService.startMission(id, auth));
    }

    @PostMapping("/{id}/finish")
    public ResponseEntity<MissionDTO> finish(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(missionService.finishMission(id, auth));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancel(@PathVariable Long id, Authentication auth) {
        missionService.cancelMission(id, auth);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        missionService.deleteMission(id, auth);
        return ResponseEntity.noContent().build();
    }
    @PutMapping("/{id}")
    public ResponseEntity<MissionDTO> updateMission(
            @PathVariable Long id,
            @RequestBody MissionDTO dto,
            Authentication auth
    ) {
        return ResponseEntity.ok(missionService.updateMission(id, dto, auth));
    }
}