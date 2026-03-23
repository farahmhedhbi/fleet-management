package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.CreateDriverByOwnerRequest;
import com.example.fleet_backend.dto.DriverDTO;
import com.example.fleet_backend.service.DriverService;
import jakarta.validation.Valid;
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

    @GetMapping("/me")
    @PreAuthorize("hasRole('DRIVER')")
    public DriverDTO me(Authentication auth) {
        return driverService.getMyProfile(auth);
    }

    @GetMapping
    @PreAuthorize("hasRole('OWNER')")
    public List<DriverDTO> list(Authentication auth) {
        return driverService.getMyDrivers(auth);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public DriverDTO get(@PathVariable Long id, Authentication auth) {
        return driverService.getMyDriverById(id, auth);
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public DriverDTO create(@Valid @RequestBody CreateDriverByOwnerRequest request,
                            Authentication auth) {
        return driverService.createDriverByOwner(request, auth);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public DriverDTO update(@PathVariable Long id,
                            @RequestBody DriverDTO dto,
                            Authentication auth) {
        return driverService.updateMyDriver(id, dto, auth);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        driverService.deleteMyDriver(id, auth);
        return ResponseEntity.noContent().build();
    }
}