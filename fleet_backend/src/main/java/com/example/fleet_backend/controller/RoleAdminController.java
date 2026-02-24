package com.example.fleet_backend.controller;

import com.example.fleet_backend.model.Role;
import com.example.fleet_backend.repository.RoleRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ✅ RoleAdminController
 *
 * Contrôleur REST permettant de consulter les rôles
 * disponibles dans le système.
 *
 * Base URL : /api/admin/roles
 *
 * Utilisé principalement par :
 * - Interface Admin (gestion utilisateurs)
 * - Sélection de rôle lors création / modification user
 */
@RestController
@RequestMapping("/api/admin/roles")
public class RoleAdminController {

    private final RoleRepository roleRepository;

    // Injection par constructeur (bonne pratique Spring)
    public RoleAdminController(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    /**
     * 📋 Retourne la liste complète des rôles en base.
     *
     * Exemple de rôles :
     * - ROLE_ADMIN
     * - ROLE_OWNER
     * - ROLE_DRIVER
     * - ROLE_API_CLIENT
     *
     * GET /api/admin/roles
     *
     * ⚠ Important :
     * Cette route devrait être protégée avec @PreAuthorize
     * pour éviter un accès non autorisé en production.
     */
    @GetMapping
    public List<Role> list() {
        return roleRepository.findAll();
    }
}