package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.VehicleDTO;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.security.SubscriptionGuard;
import com.example.fleet_backend.service.VehicleService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@CrossOrigin(origins = "*", maxAge = 3600)
public class VehicleController {

    private final VehicleService vehicleService;
    private final SubscriptionGuard subscriptionGuard;

    public VehicleController(VehicleService vehicleService, SubscriptionGuard subscriptionGuard) {
        this.vehicleService = vehicleService;
        this.subscriptionGuard = subscriptionGuard;
    }

    /**
     * OWNER : voit seulement ses véhicules
     */
    @GetMapping
    @PreAuthorize("hasRole('OWNER')")
    public List<VehicleDTO> list(Authentication auth) {
        subscriptionGuard.requireOwnerActive(auth);
        return vehicleService.getVehiclesForConnectedUser(auth);
    }

    /**
     * OWNER : voir un de ses véhicules
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public VehicleDTO getById(@PathVariable Long id, Authentication auth) {
        subscriptionGuard.requireOwnerActive(auth);
        return vehicleService.getVehicleByIdSecured(id, auth);
    }

    /**
     * OWNER : créer un véhicule
     */
    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public VehicleDTO create(@RequestBody VehicleDTO dto, Authentication auth) {
        subscriptionGuard.requireOwnerActive(auth);
        return vehicleService.createVehicleSecured(dto, auth);
    }

    /**
     * OWNER : modifier un de ses véhicules
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public VehicleDTO update(@PathVariable Long id,
                             @RequestBody VehicleDTO dto,
                             Authentication auth) {
        subscriptionGuard.requireOwnerActive(auth);
        return vehicleService.updateVehicleSecured(id, dto, auth);
    }

    /**
     * OWNER : supprimer un de ses véhicules
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        subscriptionGuard.requireOwnerActive(auth);
        vehicleService.deleteVehicleSecured(id, auth);
        return ResponseEntity.noContent().build();
    }

    /**
     * OWNER : désaffecter un driver d’un véhicule
     */
    @PostMapping("/{id}/unassign-driver")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Vehicle> unassignDriver(@PathVariable Long id, Authentication auth) {
        subscriptionGuard.requireOwnerActive(auth);
        Vehicle updated = vehicleService.unassignDriver(id);
        return ResponseEntity.ok(updated);
    }

    /**
     * OWNER : retirer le conducteur d’un véhicule
     */
    @PostMapping("/{id}/remove-driver")
    @PreAuthorize("hasRole('OWNER')")
    public VehicleDTO removeDriver(@PathVariable Long id, Authentication auth) {
        subscriptionGuard.requireOwnerActive(auth);
        return vehicleService.removeDriverFromVehicleSecured(id, auth);
    }
}