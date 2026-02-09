// DriverController.java
package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.DriverDTO;
import com.example.fleet_backend.service.DriverService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {

    @Autowired
    private DriverService driverService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('OWNER')")
    public List<DriverDTO> getAllDrivers() {
        return driverService.getAllDrivers();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OWNER')")
    public DriverDTO getDriverById(@PathVariable Long id) {
        return driverService.getDriverById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('OWNER')")
    public DriverDTO createDriver(@RequestBody DriverDTO driverDTO) {
        return driverService.createDriver(driverDTO);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OWNER')")
    public DriverDTO updateDriver(@PathVariable Long id, @RequestBody DriverDTO driverDTO) {
        return driverService.updateDriver(id, driverDTO);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteDriver(@PathVariable Long id) {
        driverService.deleteDriver(id);
    }

    // ✅ DRIVER : profil personnel
    @GetMapping("/me")
    @PreAuthorize("hasRole('DRIVER')")
    public DriverDTO me(Authentication auth) {
        return driverService.getMyProfile(auth);
    }
}
