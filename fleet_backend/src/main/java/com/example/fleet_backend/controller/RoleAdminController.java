package com.example.fleet_backend.controller;

import com.example.fleet_backend.model.Role;
import com.example.fleet_backend.repository.RoleRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/roles")
public class RoleAdminController {

    private final RoleRepository roleRepository;

    public RoleAdminController(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @GetMapping
    public List<Role> list() {
        return roleRepository.findAll();
    }
}
