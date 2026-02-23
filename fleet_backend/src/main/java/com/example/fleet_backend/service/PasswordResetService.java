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

@Service
@Transactional
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${app.frontend.reset-url}")
    private String resetUrl; // ex: http://localhost:3000/reset-password

    @Value("${app.frontend.activation-url}")
    private String activationUrl; // ex: http://localhost:3000/activate-account

    public PasswordResetService(UserRepository userRepository,
                                PasswordResetTokenRepository tokenRepository,
                                PasswordEncoder passwordEncoder,
                                EmailService emailService) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public void createResetTokenAndSendEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        // Supprime les anciens tokens de cet user (si tu as cette méthode repo)
        tokenRepository.deleteByUserId(user.getId());

        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiresAt(Instant.now().plus(Duration.ofMinutes(15)));
        resetToken.setUsed(false);

        tokenRepository.save(resetToken);

        String link = resetUrl + "?token=" + token;
        emailService.sendPasswordResetEmail(user.getEmail(), link);
    }

    public void resetPassword(String token, String newPassword) {
        PasswordResetToken t = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token invalide"));

        if (t.isUsed()) throw new IllegalArgumentException("Token déjà utilisé");
        if (t.getExpiresAt().isBefore(Instant.now())) throw new IllegalArgumentException("Token expiré");

        User user = t.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setEnabled(true);
        userRepository.save(user);

        // Marquer utilisé puis supprimer
        t.setUsed(true);
        tokenRepository.save(t);
        tokenRepository.deleteById(t.getId());
    }

    public void createActivationTokenAndSendEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        tokenRepository.deleteByUserId(user.getId());

        String token = UUID.randomUUID().toString();

        PasswordResetToken t = new PasswordResetToken();
        t.setToken(token);
        t.setUser(user);
        t.setExpiresAt(Instant.now().plus(Duration.ofHours(24)));
        t.setUsed(false);

        tokenRepository.save(t);

        String link = activationUrl + "?token=" + token;
        emailService.sendAccountActivationEmail(user.getEmail(), link);
    }
}