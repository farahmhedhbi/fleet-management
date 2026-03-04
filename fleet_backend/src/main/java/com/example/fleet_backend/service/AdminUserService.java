package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.UserAdminDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.DriverRepository;
import com.example.fleet_backend.repository.PasswordResetTokenRepository;
import com.example.fleet_backend.repository.UserRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * ✅ AdminUserService
 *
 * Service métier réservé à l’ADMIN pour gérer les comptes utilisateurs.
 *
 * Fonctionnalités:
 * 1) Lister les utilisateurs (avec filtre enabled true/false optionnel)
 * 2) Activer / désactiver un compte (enabled)
 * 3) Supprimer un utilisateur + nettoyer toutes les dépendances (tokens, driver profile, véhicules...)
 *
 * @Transactional:
 * - Toutes les opérations sont exécutées dans une seule transaction.
 * - Si un delete échoue (FK / contrainte), rollback automatique.
 */
@Service
@Transactional
public class AdminUserService {

    /**
     * ✅ Repositories nécessaires à l’admin:
     * - UserRepository: lire / activer / supprimer user
     * - PasswordResetTokenRepository: supprimer tokens liés au user (reset/activation)
     * - DriverRepository: supprimer profil Driver associé (si rôle driver)
     * - VehicleRepository: supprimer les véhicules appartenant à un owner
     */
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;

    /**
     * ✅ Injection par constructeur (bonne pratique)
     */
    public AdminUserService(UserRepository userRepository,
                            PasswordResetTokenRepository tokenRepository,
                            DriverRepository driverRepository,
                            VehicleRepository vehicleRepository) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
    }

    /**
     * ✅ Liste des utilisateurs avec filtre optionnel "enabled"
     *
     * @param enabled
     *   - null  => retourner tous les users
     *   - true  => retourner seulement les users activés
     *   - false => retourner seulement les users désactivés
     *
     * @return liste de UserAdminDTO (format prêt pour tableau admin)
     */
    public List<UserAdminDTO> list(Boolean enabled) {

        // ✅ Si enabled est null => pas de filtre
        List<User> users = (enabled == null)
                ? userRepository.findAll()
                : userRepository.findAllByEnabled(enabled);

        // ✅ Mapper Entity -> DTO pour éviter d'exposer l'entité directement
        return users.stream()
                .filter(u -> u.getRole() == null || !"ROLE_ADMIN".equals(u.getRole().getName()))
                .map(this::toDto)
                .toList();
    }

    /**
     * ✅ Activer / désactiver un utilisateur
     *
     * @param id    identifiant user
     * @param value true = activer, false = désactiver
     * @return UserAdminDTO mis à jour
     */
    public UserAdminDTO setEnabled(Long id, boolean value) {

        // 404 si user introuvable
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Mettre à jour le statut
        u.setEnabled(value);

        // Sauvegarder et retourner DTO
        return toDto(userRepository.save(u));
    }

    /**
     * ✅ Supprimer un utilisateur (delete complet)
     *
     * Objectif:
     * - éviter les erreurs de contraintes FK
     * - supprimer toutes les données dépendantes liées à cet utilisateur
     *
     * Ordre choisi:
     * 1) supprimer tokens reset/activation
     * 2) supprimer profil driver (si existe)
     * 3) supprimer véhicules si user est owner (stratégie A)
     * 4) supprimer user
     *
     * @param id identifiant user à supprimer
     */
    public void delete(Long id) {

        // 404 si introuvable
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        try {
            // ✅ 1) supprimer tokens reset/activation liés au user
            // (évite token orphelin et problèmes FK si relation existe)
            tokenRepository.deleteByUserId(u.getId());

            // ✅ 2) supprimer profil driver si existe (liée par email)
            // (si le user est driver, la table drivers peut dépendre du user)
            driverRepository.deleteByEmail(u.getEmail());

            /**
             * ✅ 3) si owner => gérer ses véhicules
             *
             * Ici tu as choisi la stratégie A:
             * a) supprimer les véhicules appartenant à cet owner
             *
             * (Alternative possible: détacher owner/driver ou transférer ownership)
             */
            vehicleRepository.deleteByOwnerId(u.getId());

            // ✅ 4) supprimer le user à la fin
            userRepository.delete(u);

        } catch (DataIntegrityViolationException ex) {
            /**
             * ✅ Si on arrive ici:
             * - il reste une relation FK ailleurs qui empêche le delete
             * - exemple: incidents, maintenances, trajets, etc.
             *
             * On renvoie une erreur claire pour le frontend/admin.
             */
            throw new IllegalStateException(
                    "Impossible de supprimer l'utilisateur car il est référencé par d'autres données.", ex
            );
        }
    }

    /**
     * ✅ Mapper User -> UserAdminDTO
     *
     * DTO admin contient:
     * - id, nom, email
     * - rôle (ROLE_ADMIN/ROLE_OWNER/ROLE_DRIVER)
     * - enabled (actif/inactif)
     * - lastLoginAt (date dernière connexion)
     *
     * Avantage:
     * - réponse propre au frontend
     * - évite d'exposer des champs sensibles du User
     */
    private UserAdminDTO toDto(User u) {
        UserAdminDTO dto = new UserAdminDTO();
        dto.id = u.getId();
        dto.firstName = u.getFirstName();
        dto.lastName = u.getLastName();
        dto.email = u.getEmail();
        dto.role = (u.getRole() != null ? u.getRole().getName() : null);
        dto.enabled = u.isEnabled();
        dto.lastLoginAt = u.getLastLoginAt();
        return dto;
    }
}