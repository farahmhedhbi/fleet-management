package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.TripIngestRequest;
import com.example.fleet_backend.service.RawIngestionService;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class ApiIngestionController {

    private final RawIngestionService rawIngestionService;

    public ApiIngestionController(RawIngestionService rawIngestionService) {
        this.rawIngestionService = rawIngestionService;
    }

    @PostMapping("/data")
    @PreAuthorize("hasAnyRole('ADMIN','OWNER')")
    public ResponseEntity<?> receive(@Valid @RequestBody TripIngestRequest req) {
        rawIngestionService.saveApiPayload(req);
        return ResponseEntity.ok(Map.of("message", "OK - stored in RAW"));
    }
}
