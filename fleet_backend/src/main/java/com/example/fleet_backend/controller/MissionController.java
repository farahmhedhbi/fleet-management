package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.MissionDTO;
import com.example.fleet_backend.service.MissionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/missions")
@CrossOrigin(origins = "*")
public class MissionController {

    private final MissionService missionService;

    public MissionController(MissionService missionService) {
        this.missionService = missionService;
    }

    @GetMapping
    public ResponseEntity<List<MissionDTO>> getAll(Authentication auth) {
        return ResponseEntity.ok(missionService.getMissions(auth));
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
}