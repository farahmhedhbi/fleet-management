package com.example.fleet_backend.controller;

import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.repository.DriverRepository;
import com.example.fleet_backend.service.DriverRestService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/driver/rest")
public class DriverRestController {

    private final DriverRepository driverRepository;
    private final DriverRestService driverRestService;

    public DriverRestController(
            DriverRepository driverRepository,
            DriverRestService driverRestService
    ) {
        this.driverRepository = driverRepository;
        this.driverRestService = driverRestService;
    }

    @PostMapping("/ready")
    public String markReady(Authentication auth) {
        Driver driver = driverRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        driverRestService.markDriverReady(driver);

        return "Driver is now AVAILABLE";
    }
}