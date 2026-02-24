package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * ✅ RoleRepository
 *
 * Interface d'accès aux données pour l'entité Role.
 *
 * Hérite de JpaRepository<Role, Long> :
 * - Role = entité JPA représentant un rôle (ROLE_ADMIN, ROLE_OWNER, etc.)
 * - Long = type de la clé primaire (id)
 *
 * Les méthodes standards héritées :
 * - save()
 * - findById()
 * - findAll()
 * - deleteById()
 * - etc.
 *
 * Ce repository est utilisé principalement dans :
 * - AuthService (registerUser)
 * - AdminService (create/update user)
 * - Initialisation des rôles au démarrage (CommandLineRunner)
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    /**
     * ✅ Trouver un rôle par son nom (String).
     *
     * Exemple :
     * - "ROLE_ADMIN"
     * - "ROLE_OWNER"
     * - "ROLE_DRIVER"
     *
     * Retourne Optional pour éviter NullPointerException.
     */
    Optional<Role> findByName(String name);

    /**
     * ✅ Méthode utilitaire pour chercher un rôle à partir de l'enum ERole.
     *
     * Role.ERole est probablement un enum dans ton entité Role :
     *   public enum ERole {
     *       ROLE_ADMIN,
     *       ROLE_OWNER,
     *       ROLE_DRIVER
     *   }
     *
     * Cette méthode:
     * - transforme l'enum en String via name()
     * - appelle la méthode findByName(String)
     *
     * Exemple :
     * findByName(Role.ERole.ROLE_ADMIN)
     */
    default Optional<Role> findByName(Role.ERole name) {
        return findByName(name.name());
    }

    /**
     * ✅ Vérifie l'existence d'un rôle à partir de l'enum ERole.
     *
     * Utilisé souvent lors de l'initialisation des données :
     * - éviter de recréer un rôle déjà existant
     *
     * Exemple :
     * existsByName(Role.ERole.ROLE_OWNER)
     */
    default boolean existsByName(Role.ERole name) {
        return findByName(name.name()).isPresent();
    }
}