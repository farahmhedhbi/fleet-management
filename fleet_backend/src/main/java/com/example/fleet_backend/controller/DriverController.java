package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.CreateDriverByOwnerRequest;
import com.example.fleet_backend.dto.DriverDTO;
import com.example.fleet_backend.service.DriverService;
import jakarta.validation.Valid;
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
     * DRIVER connecté : voir son propre profil
     */
    @GetMapping("/me")
    @PreAuthorize("hasRole('DRIVER')")
    public DriverDTO me(Authentication auth) {
        return driverService.getMyProfile(auth);
    }

    /**
     * OWNER connecté : voir seulement ses propres drivers
     */
    @GetMapping
    @PreAuthorize("hasRole('OWNER')")
    public List<DriverDTO> list(Authentication auth) {
        return driverService.getMyDrivers(auth);
    }

    /**
     * OWNER connecté : voir les détails d’un de ses drivers
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public DriverDTO get(@PathVariable Long id, Authentication auth) {
        return driverService.getMyDriverById(id, auth);
    }

    /**
     * OWNER connecté : créer un driver
     * - mot de passe généré
     * - email envoyé
     * - mustChangePassword = true
     */
    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public DriverDTO create(@Valid @RequestBody CreateDriverByOwnerRequest request,
                            Authentication auth) {
        return driverService.createDriverByOwner(request, auth);
    }

    /**
     * OWNER connecté : modifier un de ses drivers
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public DriverDTO update(@PathVariable Long id,
                            @RequestBody DriverDTO dto,
                            Authentication auth) {
        return driverService.updateMyDriver(id, dto, auth);
    }

    /**
     * OWNER connecté : supprimer un de ses drivers
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        driverService.deleteMyDriver(id, auth);
        return ResponseEntity.noContent().build();
    }
}