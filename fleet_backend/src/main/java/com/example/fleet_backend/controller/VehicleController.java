package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.VehicleDTO;
import com.example.fleet_backend.service.VehicleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")

public class VehicleController {

    @Autowired
    private VehicleService vehicleService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('OWNER')")
    public List<VehicleDTO> getAllVehicles() {
        return vehicleService.getAllVehicles();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OWNER')")
    public VehicleDTO getVehicleById(@PathVariable Long id) {
        return vehicleService.getVehicleById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('OWNER')")
    public VehicleDTO createVehicle(@RequestBody VehicleDTO vehicleDTO) {
        return vehicleService.createVehicle(vehicleDTO);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OWNER')")
    public VehicleDTO updateVehicle(@PathVariable Long id, @RequestBody VehicleDTO vehicleDTO) {
        return vehicleService.updateVehicle(id, vehicleDTO);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id) {
        vehicleService.deleteVehicle(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{vehicleId}/assign-driver/{driverId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OWNER')")
    public VehicleDTO assignDriver(@PathVariable Long vehicleId, @PathVariable Long driverId) {
        return vehicleService.assignDriverToVehicle(vehicleId, driverId);
    }

    @PostMapping("/{vehicleId}/remove-driver")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OWNER')")
    public VehicleDTO removeDriver(@PathVariable Long vehicleId) {
        return vehicleService.removeDriverFromVehicle(vehicleId);
    }

    @GetMapping("/by-driver/{driverId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OWNER')")
    public List<VehicleDTO> getVehiclesByDriver(@PathVariable Long driverId) {
        return vehicleService.getVehiclesByDriverId(driverId);
    }
}