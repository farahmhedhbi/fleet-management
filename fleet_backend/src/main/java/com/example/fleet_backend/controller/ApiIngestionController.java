package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.TripPayload;
import com.example.fleet_backend.service.ApiIngestionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ApiIngestionController {

    private final ApiIngestionService service;

    public ApiIngestionController(ApiIngestionService service) {
        this.service = service;
    }

    @PostMapping("/data")
    public ResponseEntity<?> receive(@Valid @RequestBody TripPayload payload) throws Exception {
        service.ingestTrip(payload);
        return ResponseEntity.ok().body(java.util.Map.of("status", "ok"));
    }
}

