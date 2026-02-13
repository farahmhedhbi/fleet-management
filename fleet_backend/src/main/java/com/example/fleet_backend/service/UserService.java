package com.example.fleet_backend.service;

import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Injection par constructeur (recommandé)
    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Changer le mot de passe pour un utilisateur connecté
     * @param email email de l'utilisateur (ex: auth.getName())
     * @param oldPassword ancien mot de passe
     * @param newPassword nouveau mot de passe
     */
    public void changePassword(String email, String oldPassword, String newPassword) {

        // 1) Chercher l'utilisateur
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        // 2) Vérifier l'ancien mot de passe
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            // on peut garder IllegalArgumentException, ou créer une exception métier
            throw new IllegalArgumentException("Ancien mot de passe incorrect");
        }

        // 3) Encoder et sauvegarder le nouveau
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
