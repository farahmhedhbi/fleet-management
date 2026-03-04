package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.*;
import com.example.fleet_backend.repository.VehicleRepository;
import com.example.fleet_backend.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * ✅ AdminController
 *
 * Contrôleur principal pour les actions avancées ADMIN :
 * - Gestion des owners
 * - Consultation véhicules par owner
 * - Détails utilisateur
 * - Mise à jour utilisateur
 * - Invitation utilisateur
 *
 * Base URL : /api/admin
 *
 * ⚠ Sécurité :
 * @PreAuthorize("hasRole('ADMIN')")
 * → Toutes les routes ici sont réservées aux ADMIN.
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final VehicleRepository vehicleRepository;

    // Injection par constructeur (bonne pratique)
    public AdminController(AdminService adminService,
                           VehicleRepository vehicleRepository) {
        this.adminService = adminService;
        this.vehicleRepository = vehicleRepository;
    }

    // =====================================================
    // ================== OWNERS ===========================
    // =====================================================

    /**
     * ✅ Liste des propriétaires (ROLE_OWNER)
     *
     * GET /api/admin/owners
     *
     * Utilisé pour :
     * - Dashboard Admin
     * - Gestion flotte par owner
     */
    @GetMapping("/owners")
    public List<UserDTO> owners() {
        return adminService.listOwners();
    }

    /**
     * ✅ Liste des véhicules d’un owner spécifique
     *
     * GET /api/admin/owners/{ownerId}/vehicles
     *
     * Permet à l’ADMIN de visualiser
     * toute la flotte d’un propriétaire.
     */
    @GetMapping("/owners/{ownerId}/vehicles")
    public List<VehicleDTO> vehiclesByOwner(
            @PathVariable Long ownerId) {

        return vehicleRepository.findByOwnerId(ownerId)
                .stream()
                .map(VehicleDTO::new) // Conversion Entity → DTO
                .collect(Collectors.toList());
    }

    // =====================================================
    // ================== USERS ============================
    // =====================================================

    /**
     * ✅ Détails d’un utilisateur
     *
     * GET /api/admin/users/{id}
     *
     * Retourne informations complètes
     * (sans mot de passe).
     */
    @GetMapping("/users/{id}")
    public UserDTO get(@PathVariable Long id) {
        return adminService.getUser(id);
    }

    /**
     * ✅ Mise à jour utilisateur
     *
     * PUT /api/admin/users/{id}
     *
     * Peut modifier :
     * - Nom
     * - Email
     * - Rôle
     * - Mot de passe
     * - LicenseNumber (si DRIVER)
     *
     * La logique métier est gérée dans AdminService.
     */
    @PutMapping("/users/{id}")
    public UserDTO update(@PathVariable Long id,
                          @RequestBody UpdateUserRequest req) {

        return adminService.updateUser(id, req);
    }

    /**
     * ✅ Invitation utilisateur
     *
     * POST /api/admin/users/invite
     *
     * Processus :
     * 1️⃣ Création user (enabled = false)
     * 2️⃣ Génération mot de passe temporaire
     * 3️⃣ Création token activation
     * 4️⃣ Envoi email activation
     *
     * Sécurisé pour ADMIN uniquement.
     */
    @PostMapping("/users/invite")
    public UserDTO invite(
            @RequestBody AdminInviteUserRequest req) {

        return adminService.inviteUser(req);
    }


}