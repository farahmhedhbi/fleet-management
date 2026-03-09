package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.MissionDTO;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.service.MissionService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/missions")
@CrossOrigin(origins = "*", maxAge = 3600)
public class MissionController {

    private final MissionService missionService;

    public MissionController(MissionService missionService) {
        this.missionService = missionService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DRIVER','OWNER','ADMIN')")
    public List<MissionDTO> list(Authentication auth) {
        return missionService.list(auth);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public MissionDTO create(@RequestBody MissionDTO dto, Authentication auth) {
        return missionService.create(dto, auth);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public MissionDTO updateStatus(
            @PathVariable Long id,
            @RequestParam Mission.MissionStatus status,
            Authentication auth
    ) {
        return missionService.updateStatus(id, status, auth);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public void delete(@PathVariable Long id, Authentication auth) {
        missionService.delete(id, auth);
    }

    @PutMapping("/{id}/start")
    @PreAuthorize("hasRole('DRIVER')")
    public MissionDTO start(@PathVariable Long id, Authentication auth) {
        return missionService.startMission(id, auth);
    }

    @PutMapping("/{id}/finish")
    @PreAuthorize("hasRole('DRIVER')")
    public MissionDTO finish(@PathVariable Long id, Authentication auth) {
        return missionService.finishMission(id, auth);
    }
}