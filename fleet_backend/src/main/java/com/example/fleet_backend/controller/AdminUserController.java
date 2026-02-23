package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.UserAdminDTO;
import com.example.fleet_backend.service.AdminUserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    /**
     * ===============================
     * LIST USERS (option filtre enabled)
     * GET /api/admin/users
     * GET /api/admin/users?enabled=true
     * GET /api/admin/users?enabled=false
     * ===============================
     */
    @GetMapping
    public List<UserAdminDTO> list(
            @RequestParam(required = false) Boolean enabled
    ) {
        return adminUserService.list(enabled);
    }

    /**
     * ===============================
     * ENABLE / DISABLE USER
     * PUT /api/admin/users/{id}/enable?value=true
     * ===============================
     */
    @PutMapping("/{id}/enable")
    public UserAdminDTO setEnabled(
            @PathVariable Long id,
            @RequestParam boolean value
    ) {
        return adminUserService.setEnabled(id, value);
    }

    /**
     * ===============================
     * DELETE USER
     * DELETE /api/admin/users/{id}
     * ===============================
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        adminUserService.delete(id);
    }
}