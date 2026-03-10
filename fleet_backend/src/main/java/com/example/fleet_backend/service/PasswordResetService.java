package com.example.fleet_backend.service;

import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.PasswordResetToken;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.PasswordResetTokenRepository;
import com.example.fleet_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/**
 * ✅ PasswordResetService
 *
 * Service responsable de 2 fonctionnalités critiques:
 * 1) 🔁 Réinitialisation du mot de passe (Forgot Password)
 * 2) ✅ Activation du compte par email (Account Activation)
 *
 * Principe:
 * - Générer un token unique (UUID)
 * - Le sauvegarder en base (table password_reset_tokens)
 * - Envoyer un lien au frontend contenant ce token
 * - Le frontend appelle ensuite le backend avec le token pour valider
 *
 * @Service:
 * - composant métier injectable
 *
 * @Transactional:
 * - garantit la cohérence: si une étape échoue, rollback (ex: token + email)
 * - évite des états incomplets (token créé mais user non modifié, etc.)
 */
@Service
@Transactional
public class PasswordResetService {

    /**
     * ✅ Repositories
     * - UserRepository: récupérer l'utilisateur par email
     * - PasswordResetTokenRepository: créer, supprimer, valider les tokens
     */
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;

    /**
     * ✅ PasswordEncoder:
     * - encode (hash) les mots de passe avant sauvegarde
     * - indispensable pour la sécurité
     */
    private final PasswordEncoder passwordEncoder;

    /**
     * ✅ EmailService:
     * - envoie les emails (reset password / activation)
     * - encapsule la logique SMTP / templates email
     */
    private final EmailService emailService;

    /**
     * ✅ resetUrl:
     * - URL frontend vers la page reset-password
     * - Exemple: http://localhost:3000/reset-password
     * - On va y ajouter ?token=...
     */
    @Value("${app.frontend.reset-url}")
    private String resetUrl; // ex: http://localhost:3000/reset-password

    /**
     * ✅ activationUrl:
     * - URL frontend vers la page d'activation
     * - Exemple: http://localhost:3000/activate-account
     * - On va y ajouter ?token=...
     */
    @Value("${app.frontend.activation-url}")
    private String activationUrl; // ex: http://localhost:3000/activate-account

    /**
     * ✅ Injection par constructeur (bonne pratique)
     */
    public PasswordResetService(UserRepository userRepository,
                                PasswordResetTokenRepository tokenRepository,
                                PasswordEncoder passwordEncoder,
                                EmailService emailService) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    /**
     * ✅ Génère un token de reset + envoie l'email
     *
     * Flow:
     * 1) Chercher user par email
     * 2) Supprimer anciens tokens (éviter plusieurs tokens valides)
     * 3) Générer token UUID
     * 4) Sauvegarder token avec expiration courte (15 min)
     * 5) Construire lien: resetUrl + "?token=" + token
     * 6) Envoyer email reset password
     *
     * @param email email de l'utilisateur qui a demandé "mot de passe oublié"
     */
    public void createResetTokenAndSendEmail(String email) {

        // 1) Vérifier que l'utilisateur existe
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        // 2) Supprimer les anciens tokens de cet user (évite multi-tokens actifs)
        tokenRepository.deleteByUserId(user.getId());

        // 3) Token aléatoire unique
        String token = UUID.randomUUID().toString();

        // 4) Créer et sauvegarder l'entité token (expires + used)
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);

        // ✅ Reset password: expiration courte (15 minutes)
        resetToken.setExpiresAt(Instant.now().plus(Duration.ofMinutes(15)));
        resetToken.setUsed(false);

        tokenRepository.save(resetToken);

        // 5) Lien frontend: /reset-password?token=...
        String link = resetUrl + "?token=" + token;

        // 6) Envoi email
        emailService.sendPasswordResetEmail(user.getEmail(), link);
    }

    /**
     * ✅ Réinitialise le mot de passe à partir d'un token
     *
     * Flow:
     * 1) Charger le token depuis la DB
     * 2) Vérifier qu'il n'est pas utilisé
     * 3) Vérifier qu'il n'est pas expiré
     * 4) Encoder et sauvegarder le nouveau mot de passe
     * 5) Activer le compte (enabled = true) si tu utilises activation par email
     * 6) Marquer le token "used" + supprimer (évite réutilisation)
     *
     * @param token token reçu depuis le lien email
     * @param newPassword nouveau mot de passe choisi
     */
    public void resetPassword(String token, String newPassword) {

        // 1) Vérifier token existe
        PasswordResetToken t = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token invalide"));

        // 2) Vérifier token non utilisé
        if (t.isUsed()) throw new IllegalArgumentException("Token déjà utilisé");

        // 3) Vérifier token non expiré
        if (t.getExpiresAt().isBefore(Instant.now())) throw new IllegalArgumentException("Token expiré");

        // 4) Changer mot de passe
        User user = t.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));

        // ✅ Choix métier: activer le compte après reset
        // (utile si tu considères reset comme validation de l'email)
        user.setEnabled(true);

        userRepository.save(user);

        // 5) Invalider le token (éviter réutilisation)
        t.setUsed(true);
        tokenRepository.save(t);

        // 6) Supprimer le token après usage (optionnel mais propre)
        tokenRepository.deleteById(t.getId());
    }



}