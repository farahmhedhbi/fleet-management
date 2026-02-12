package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.UserAdminDTO;
import com.example.fleet_backend.service.AdminUserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public List<UserAdminDTO> list(@RequestParam(required = false) Boolean enabled) {
        return adminUserService.list(enabled);
    }

    @PutMapping("/{id}/enable")
    public UserAdminDTO enable(@PathVariable Long id, @RequestParam boolean value) {
        return adminUserService.setEnabled(id, value);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        adminUserService.delete(id);
    }
}
