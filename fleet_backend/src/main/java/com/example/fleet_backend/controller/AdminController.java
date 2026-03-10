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
    private final AdminInvitationService adminInvitationService;
    private final DriverService driverService;

    // Injection par constructeur (bonne pratique)
    public AdminController(AdminService adminService,
                           VehicleRepository vehicleRepository, AdminInvitationService adminInvitationService, DriverService driverService) {
        this.adminService = adminService;
        this.vehicleRepository = vehicleRepository;
        this.adminInvitationService = adminInvitationService;
        this.driverService = driverService;
    }

    // =====================================================
    // ================== OWNERS ===========================
    // =====================================================

    /**
     * ✅ Liste des propriétaires (ROLE_OWNER)
     * <p>
     * GET /api/admin/owners
     * <p>
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
     * <p>
     * GET /api/admin/owners/{ownerId}/vehicles
     * <p>
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
     * <p>
     * GET /api/admin/users/{id}
     * <p>
     * Retourne informations complètes
     * (sans mot de passe).
     */
    @GetMapping("/users/{id}")
    public UserDTO get(@PathVariable Long id) {
        return adminService.getUser(id);
    }

    /**
     * ✅ Mise à jour utilisateur
     * <p>
     * PUT /api/admin/users/{id}
     * <p>
     * Peut modifier :
     * - Nom
     * - Email
     * - Rôle
     * - Mot de passe
     * - LicenseNumber (si DRIVER)
     * <p>
     * La logique métier est gérée dans AdminService.
     */
    @PutMapping("/users/{id}")
    public UserDTO update(@PathVariable Long id,
                          @RequestBody UpdateUserRequest req) {

        return adminService.updateUser(id, req);
    }

    /**
     * ✅ Invitation utilisateur
     * <p>
     * POST /api/admin/users/invite
     * <p>
     * Processus :
     * 1️⃣ Création user (enabled = false)
     * 2️⃣ Génération mot de passe temporaire
     * 3️⃣ Création token activation
     * 4️⃣ Envoi email activation
     * <p>
     * Sécurisé pour ADMIN uniquement.
     */
    @PostMapping("/owners/invite")
    public UserDTO inviteOwner(@Valid @RequestBody AdminInviteOwnerRequest req) {
        return adminInvitationService.inviteOwner(req);
    }

    /**
     * ADMIN : voir le nombre des drivers d'un owner
     */
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