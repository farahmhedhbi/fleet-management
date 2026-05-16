package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.*;
import com.example.fleet_backend.model.Mission;
import com.example.fleet_backend.service.SmartDispatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/owner/dispatch")
public class SmartDispatchController {

    private final SmartDispatchService smartDispatchService;

    public SmartDispatchController(SmartDispatchService smartDispatchService) {
        this.smartDispatchService = smartDispatchService;
    }

    @PostMapping("/smart-assignment")
    public ResponseEntity<DispatchSuggestionDTO> smartAssignment(
            @RequestBody SmartAssignmentRequest request,
            Authentication auth
    ) {
        return ResponseEntity.ok(smartDispatchService.smartAssignment(request, auth));
    }

    @PostMapping("/daily-planning")
    public ResponseEntity<DispatchSuggestionDTO> smartDailyPlanning(
            @RequestBody SmartDailyPlanningRequest request,
            Authentication auth
    ) {
        return ResponseEntity.ok(smartDispatchService.smartDailyPlanning(request, auth));
    }




    @PostMapping("/confirm-daily-planning")
    public ResponseEntity<List<CreatedMissionDTO>> confirmDailyPlanning(
            @RequestBody ConfirmDailyPlanningRequest request,
            Authentication auth
    ) {
        return ResponseEntity.ok(
                smartDispatchService.confirmDailyPlanning(request, auth)
        );
    }
}