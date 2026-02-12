package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.CreateUserRequest;
import com.example.fleet_backend.dto.UpdateUserRequest;
import com.example.fleet_backend.dto.UserDTO;
import com.example.fleet_backend.dto.VehicleDTO;
import com.example.fleet_backend.repository.VehicleRepository;
import com.example.fleet_backend.service.AdminService;
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

    public AdminController(AdminService adminService, VehicleRepository vehicleRepository) {
        this.adminService = adminService;
        this.vehicleRepository = vehicleRepository;
    }

    // ===== Owners =====
    @GetMapping("/owners")
    public List<UserDTO> owners() {
        return adminService.listOwners();
    }

    @GetMapping("/owners/{ownerId}/vehicles")
    public List<VehicleDTO> vehiclesByOwner(@PathVariable Long ownerId) {
        return vehicleRepository.findByOwnerId(ownerId)
                .stream().map(VehicleDTO::new)
                .collect(Collectors.toList());
    }

    // ===== Users management =====
    @GetMapping("/users/summary")
    public List<UserDTO> users() {
        return adminService.listUsers();
    }

    @GetMapping("/users/{id}")
    public UserDTO get(@PathVariable Long id) {
        return adminService.getUser(id);
    }

    @PostMapping("/users")
    public UserDTO create(@RequestBody CreateUserRequest req) {
        return adminService.createUser(req);
    }

    @PutMapping("/users/{id}")
    public UserDTO update(@PathVariable Long id, @RequestBody UpdateUserRequest req) {
        return adminService.updateUser(id, req);
    }

    @DeleteMapping("/manage/users/{id}")
    public void delete(@PathVariable Long id) {
        adminService.deleteUser(id);
    }


}

