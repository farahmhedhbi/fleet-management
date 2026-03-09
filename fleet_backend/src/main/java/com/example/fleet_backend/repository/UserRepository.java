package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ✅ UserRepository
 *
 * Interface d'accès aux données pour l'entité User.
 *
 * Hérite de JpaRepository<User, Long> :
 * - User = entité JPA
 * - Long = type de la clé primaire (id)
 *
 * JpaRepository fournit automatiquement :
 * - save()
 * - findById()
 * - findAll()
 * - deleteById()
 * - count()
 * - etc.
 *
 * Spring Data JPA génère automatiquement les requêtes SQL
 * à partir des noms des méthodes (query derivation).
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * ✅ Trouver un utilisateur par email.
     *
     * Très important pour :
     * - Login (UserDetailsServiceImpl)
     * - Vérifier existence avant inscription
     *
     * Retourne Optional pour éviter NullPointerException.
     */
    Optional<User> findByEmail(String email);

    /**
     * ✅ Vérifier si un email existe déjà.
     *
     * Utilisé pour :
     * - registerUser()
     * - createUser()
     * - inviteUser()
     *
     * Permet d’éviter les doublons.
     */
    Boolean existsByEmail(String email);

    /**
     * ✅ Requête JPQL personnalisée pour récupérer tous les OWNER.
     *
     * @Query permet d’écrire une requête JPQL manuelle.
     *
     * Ici :
     * - On sélectionne les utilisateurs dont role.name = 'ROLE_OWNER'
     *
     * Utilisé dans :
     * - AdminService.listOwners()
     */
    @Query("select u from User u where u.role.name = 'ROLE_OWNER'")
    List<User> findAllOwners();

    /**
     * ✅ Trouver tous les utilisateurs selon leur statut enabled.
     *
     * - true  → utilisateurs actifs
     * - false → utilisateurs désactivés
     *
     * Utilisé dans :
     * - AdminUserService.list(Boolean enabled)
     *
     * Spring génère automatiquement la requête:
     * SELECT * FROM users WHERE enabled = ?
     */
    List<User> findAllByEnabled(Boolean enabled);

    // ✅ NEW: vérifier / compter les admins (admin unique)
    long countByRole_Name(String roleName);
    boolean existsByRole_Name(String roleName);

    Optional<User> findFirstByRole_Name(String roleName);
    Optional<User> findByEmailIgnoreCase(String email);

    Boolean existsByPhone(String phone);


    boolean existsByEmailIgnoreCase(String email);



}