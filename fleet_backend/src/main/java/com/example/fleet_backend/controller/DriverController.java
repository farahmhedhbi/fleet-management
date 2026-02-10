package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.DriverDTO;
import com.example.fleet_backend.service.DriverService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drivers")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DriverController {

    private final DriverService driverService;

    public DriverController(DriverService driverService) {
        this.driverService = driverService;
    }

    // ✅ DRIVER: only his profile
    @GetMapping("/me")
    @PreAuthorize("hasRole('DRIVER')")
    public DriverDTO me(Authentication auth) {
        return driverService.getMyProfile(auth);
    }

    // ✅ OWNER/ADMIN: list drivers
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public List<DriverDTO> list() {
        return driverService.getAllDrivers();
    }

    // ✅ OWNER/ADMIN: get driver by id
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public DriverDTO get(@PathVariable Long id) {
        return driverService.getDriverById(id);
    }

    // ✅ ADMIN only: create driver
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public DriverDTO create(@RequestBody DriverDTO dto) {
        return driverService.createDriver(dto);
    }

    // ✅ OWNER/ADMIN: update driver
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public DriverDTO update(@PathVariable Long id, @RequestBody DriverDTO dto) {
        return driverService.updateDriver(id, dto);
    }

    // ✅ ADMIN only: delete driver (comme ton frontend)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        driverService.deleteDriver(id);
        return ResponseEntity.noContent().build();
    }
}
