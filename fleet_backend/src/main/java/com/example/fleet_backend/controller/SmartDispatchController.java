package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.DispatchSuggestionDTO;
import com.example.fleet_backend.dto.SmartAssignmentRequest;
import com.example.fleet_backend.service.SmartDispatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
        return ResponseEntity.ok(
                smartDispatchService.smartAssignment(request, auth)
        );
    }
}