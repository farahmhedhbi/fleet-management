package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.UserAdminDTO;
import com.example.fleet_backend.service.AdminUserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ✅ AdminUserController
 *
 * Contrôleur réservé aux ADMIN pour :
 * - Lister les utilisateurs
 * - Activer / Désactiver un compte
 * - Supprimer un utilisateur
 *
 * Base URL : /api/admin/users
 *
 * ⚠ Sécurité :
 * @PreAuthorize("hasRole('ADMIN')")
 * → Toutes les routes de ce controller
 *   sont accessibles uniquement aux ADMIN.
 */
@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    // Injection par constructeur (bonne pratique)
    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    /**
     * ===============================
     * ✅ LIST USERS (avec filtre optionnel enabled)
     *
     * GET  /api/admin/users
     * GET  /api/admin/users?enabled=true
     * GET  /api/admin/users?enabled=false
     *
     * - Si enabled = null → retourne tous les users
     * - Sinon → filtre par statut (actif / inactif)
     *
     * Retourne UserAdminDTO :
     * - id
     * - email
     * - rôle
     * - enabled
     * - lastLoginAt
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
     * ✅ ENABLE / DISABLE USER
     *
     * PUT /api/admin/users/{id}/enable?value=true
     *
     * Permet à l'ADMIN de :
     * - Activer un compte (enabled = true)
     * - Désactiver un compte (enabled = false)
     *
     * Important :
     * Si enabled = false → l'utilisateur
     * ne pourra plus se connecter (Spring Security).
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
     * ✅ DELETE USER
     *
     * DELETE /api/admin/users/{id}
     *
     * Processus dans le service :
     * 1️⃣ Supprimer tokens reset/activation
     * 2️⃣ Supprimer profil driver si existe
     * 3️⃣ Supprimer véhicules liés si owner
     * 4️⃣ Supprimer user
     *
     * ⚠ Gestion des contraintes FK incluse.
     * ===============================
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        adminUserService.delete(id);
    }
}