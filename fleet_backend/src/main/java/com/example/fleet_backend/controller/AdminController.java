package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.*;
import com.example.fleet_backend.repository.VehicleRepository;
import com.example.fleet_backend.service.AdminInvitationService;
import com.example.fleet_backend.service.AdminService;
import com.example.fleet_backend.service.DriverService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final VehicleRepository vehicleRepository;
    private final AdminInvitationService adminInvitationService;
    private final DriverService driverService;
    public AdminController(AdminService adminService,
                           VehicleRepository vehicleRepository, AdminInvitationService adminInvitationService, DriverService driverService) {
        this.adminService = adminService;
        this.vehicleRepository = vehicleRepository;
        this.adminInvitationService = adminInvitationService;
        this.driverService = driverService;
    }

    @GetMapping("/owners")
    public List<UserDTO> owners() {
        return adminService.listOwners();
    }

    @GetMapping("/owners/{ownerId}/vehicles")
    public List<VehicleDTO> vehiclesByOwner(
            @PathVariable Long ownerId) {

        return vehicleRepository.findByOwnerId(ownerId)
                .stream()
                .map(VehicleDTO::new) // Conversion Entity → DTO
                .collect(Collectors.toList());
    }

    @GetMapping("/users/{id}")
    public UserDTO get(@PathVariable Long id) {
        return adminService.getUser(id);
    }

    @PutMapping("/users/{id}")
    public UserDTO update(@PathVariable Long id,
                          @RequestBody UpdateUserRequest req) {

        return adminService.updateUser(id, req);
    }

    @PostMapping("/owners/invite")
    public UserDTO inviteOwner(@Valid @RequestBody AdminInviteOwnerRequest req) {
        return adminInvitationService.inviteOwner(req);
    }

    @GetMapping("/owners/{ownerId}/drivers/count")
    public OwnerDriverCountDTO countDriversByOwner(@PathVariable Long ownerId) {
        long count = driverService.countDriversByOwner(ownerId);
        return new OwnerDriverCountDTO(ownerId, count);
    }
    @GetMapping("/owners/{ownerId}/vehicles/count")
    public OwnerVehicleCountDTO countVehiclesByOwner(@PathVariable Long ownerId) {
        long count = vehicleRepository.countByOwnerId(ownerId);
        return new OwnerVehicleCountDTO(ownerId, count);
    }





}