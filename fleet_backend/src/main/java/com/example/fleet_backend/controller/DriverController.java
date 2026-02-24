package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.DriverDTO;
import com.example.fleet_backend.service.DriverService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ✅ DriverController
 *
 * Contrôleur REST pour la gestion des conducteurs.
 *
 * Base URL : /api/drivers
 *
 * Toutes les routes sont protégées par JWT + rôles.
 * La logique métier est déléguée à DriverService.
 */
@RestController
@RequestMapping("/api/drivers")
@CrossOrigin(origins = "*", maxAge = 3600) // Autorise le frontend (CORS)
public class DriverController {

    private final DriverService driverService;

    // Injection par constructeur (bonne pratique Spring)
    public DriverController(DriverService driverService) {
        this.driverService = driverService;
    }

    /**
     * ✅ DRIVER uniquement : récupérer son propre profil
     *
     * GET /api/drivers/me
     *
     * Authentication permet d'identifier l'utilisateur connecté
     * via JWT (email extrait du token).
     */
    @GetMapping("/me")
    @PreAuthorize("hasRole('DRIVER')")
    public DriverDTO me(Authentication auth) {
        return driverService.getMyProfile(auth);
    }

    /**
     * ✅ OWNER ou ADMIN : liste complète des drivers
     *
     * GET /api/drivers
     *
     * OWNER peut voir les drivers (ex: pour assignation véhicule).
     * ADMIN peut tout voir.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public List<DriverDTO> list() {
        return driverService.getAllDrivers();
    }

    /**
     * ✅ OWNER ou ADMIN : récupérer un driver par ID
     *
     * GET /api/drivers/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public DriverDTO get(@PathVariable Long id) {
        return driverService.getDriverById(id);
    }

    /**
     * ✅ ADMIN uniquement : créer un driver
     *
     * POST /api/drivers
     *
     * Vérifications faites dans le service :
     * - Email unique
     * - LicenseNumber unique
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public DriverDTO create(@RequestBody DriverDTO dto) {
        return driverService.createDriver(dto);
    }

    /**
     * ✅ OWNER ou ADMIN : modifier un driver
     *
     * PUT /api/drivers/{id}
     *
     * Le service gère :
     * - Validation email unique
     * - Mise à jour des champs
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public DriverDTO update(@PathVariable Long id, @RequestBody DriverDTO dto) {
        return driverService.updateDriver(id, dto);
    }

    /**
     * ✅ ADMIN uniquement : supprimer un driver
     *
     * DELETE /api/drivers/{id}
     *
     * Retourne 204 No Content si suppression réussie.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        driverService.deleteDriver(id);
        return ResponseEntity.noContent().build();
    }
}