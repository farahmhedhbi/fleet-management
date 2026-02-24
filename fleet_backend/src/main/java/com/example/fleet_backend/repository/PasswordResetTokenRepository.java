package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * ✅ PasswordResetTokenRepository
 *
 * Repository JPA pour l'entité PasswordResetToken.
 *
 * Cette table sert à gérer :
 * - 🔐 Réinitialisation de mot de passe
 * - 👤 Activation de compte
 *
 * Chaque token est associé à :
 * - un utilisateur (User)
 * - une date d’expiration
 * - un état "used" (déjà utilisé ou non)
 *
 * Hérite de JpaRepository<PasswordResetToken, Long> :
 * - PasswordResetToken = entité
 * - Long = type de la clé primaire
 *
 * Méthodes standards disponibles :
 * - save()
 * - findById()
 * - deleteById()
 * - findAll()
 * - etc.
 */
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    /**
     * ✅ Supprimer tous les tokens liés à un utilisateur donné.
     *
     * Pourquoi ?
     * - Éviter plusieurs tokens actifs pour le même user
     * - Nettoyer avant de générer un nouveau token
     *
     * @Modifying :
     * - Indique que la requête modifie la base (DELETE/UPDATE)
     *
     * @Query :
     * - Requête JPQL personnalisée
     *
     * @Param :
     * - Lie le paramètre userId à la requête
     *
     * Requête équivalente SQL :
     * DELETE FROM password_reset_tokens WHERE user_id = ?
     */
    @Modifying
    @Query("delete from PasswordResetToken t where t.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    /**
     * ✅ Trouver un token par sa valeur (String).
     *
     * Utilisé dans :
     * - PasswordResetService.resetPassword()
     * - Validation d’activation de compte
     *
     * Retourne Optional pour éviter NullPointerException.
     */
    Optional<PasswordResetToken> findByToken(String token);
}