package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.VehicleDTO;
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

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    // ✅ DRIVER/OWNER/ADMIN -> filtrage dans le service
    @GetMapping
    @PreAuthorize("hasAnyRole('DRIVER','OWNER','ADMIN')")
    public List<VehicleDTO> list(Authentication auth) {
        return vehicleService.getVehiclesForConnectedUser(auth);
    }

    // ✅ DRIVER/OWNER/ADMIN -> service vérifie périmètre
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DRIVER','OWNER','ADMIN')")
    public VehicleDTO getById(@PathVariable Long id, Authentication auth) {
        return vehicleService.getVehicleByIdSecured(id, auth);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public VehicleDTO create(@RequestBody VehicleDTO dto, Authentication auth) {
        System.out.println("AUTH user=" + auth.getName());
        System.out.println("AUTH roles=" + auth.getAuthorities());
        return vehicleService.createVehicleSecured(dto, auth);
    }

    // ✅ OWNER/ADMIN seulement
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public VehicleDTO update(@PathVariable Long id, @RequestBody VehicleDTO dto, Authentication auth) {
        return vehicleService.updateVehicleSecured(id, dto, auth);
    }

    // ✅ OWNER/ADMIN seulement
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        vehicleService.deleteVehicleSecured(id, auth);
        return ResponseEntity.noContent().build();
    }

    // ✅ assign driver : OWNER/ADMIN seulement
    @PostMapping("/{id}/assign-driver/{driverId}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public VehicleDTO assignDriver(@PathVariable Long id, @PathVariable Long driverId, Authentication auth) {
        return vehicleService.assignDriverToVehicleSecured(id, driverId, auth);
    }

    // ✅ remove driver : OWNER/ADMIN seulement
    @PostMapping("/{id}/remove-driver")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public VehicleDTO removeDriver(@PathVariable Long id, Authentication auth) {
        return vehicleService.removeDriverFromVehicleSecured(id, auth);
    }
}
