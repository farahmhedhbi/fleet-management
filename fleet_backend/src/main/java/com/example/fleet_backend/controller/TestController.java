package com.example.fleet_backend.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * ✅ TestController
 *
 * Contrôleur utilisé pour tester la configuration
 * de Spring Security + JWT + rôles.
 *
 * Base URL : /api/test
 *
 * Permet de vérifier que :
 * - L’authentification fonctionne
 * - Les rôles sont bien interprétés
 * - @PreAuthorize est correctement configuré
 */
@RestController
@RequestMapping("/api/test")
public class TestController {

    /**
     * 🌍 Endpoint PUBLIC
     *
     * Accessible sans authentification.
     * Permet de vérifier que le backend fonctionne.
     *
     * GET /api/test/all
     */
    @GetMapping("/all")
    public String allAccess() {
        return "Public Content.";
    }

    /**
     * 🚗 Endpoint réservé aux DRIVER
     *
     * Nécessite :
     * - Token JWT valide
     * - Rôle ROLE_DRIVER
     *
     * GET /api/test/driver
     */
    @GetMapping("/driver")
    @PreAuthorize("hasRole('DRIVER')")
    public String driverAccess() {
        return "Driver Content.";
    }

    /**
     * 🚙 Endpoint réservé aux OWNER
     *
     * Nécessite :
     * - Token JWT valide
     * - Rôle ROLE_OWNER
     *
     * GET /api/test/owner
     */
    @GetMapping("/owner")
    @PreAuthorize("hasRole('OWNER')")
    public String ownerAccess() {
        return "Owner Content.";
    }

    /**
     * 👑 Endpoint réservé aux ADMIN
     *
     * Nécessite :
     * - Token JWT valide
     * - Rôle ROLE_ADMIN
     *
     * GET /api/test/admin
     */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public String adminAccess() {
        return "Admin Content.";
    }
}