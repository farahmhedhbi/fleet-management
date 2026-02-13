package com.example.fleet_backend.service;

import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.PasswordResetToken;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.PasswordResetTokenRepository;
import com.example.fleet_backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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

        tokenRepository.deleteByUserId(user.getId()); // comme ton code :contentReference[oaicite:5]{index=5}

        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiresAt(Instant.now().plus(Duration.ofMinutes(15))); // ton code :contentReference[oaicite:6]{index=6}
        resetToken.setUsed(false);
        tokenRepository.save(resetToken);

        String link = resetUrl + "?token=" + token;
        emailService.sendPasswordResetEmail(user.getEmail(), link);
    }


    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token invalide"));

        if (resetToken.isUsed()) {
            throw new IllegalArgumentException("Token déjà utilisé");
        }

        if (resetToken.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Token expiré");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
    }
}

