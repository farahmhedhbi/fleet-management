package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.AdminStatsDTO;
import com.example.fleet_backend.service.AdminStatsService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminStatsController {

    private final AdminStatsService adminStatsService;

    public AdminStatsController(AdminStatsService adminStatsService) {
        this.adminStatsService = adminStatsService;
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public AdminStatsDTO stats() {
        return adminStatsService.getStats();
    }
}