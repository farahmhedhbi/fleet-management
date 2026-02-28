package com.example.fleet_backend.service;

import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * ✅ UserService: couche métier dédiée aux opérations sur l'utilisateur.
 *
 * Objectif principal ici:
 * - Permettre à un utilisateur connecté de changer son mot de passe
 * - Centraliser la logique sécurité (vérification ancien mot de passe + encodage)
 *
 * @Service :
 * - Déclare la classe comme un service Spring (injectable dans controllers/other services).
 *
 * @Transactional :
 * - Exécute les opérations DB dans une transaction.
 * - En cas d'erreur (exception), la transaction est annulée (rollback).
 */
@Service
@Transactional
public class UserService {

    /**
     * ✅ UserRepository:
     * - Accès à la table users (findByEmail, save, etc.)
     */
    private final UserRepository userRepository;

    /**
     * ✅ PasswordEncoder:
     * - Encode (hash) les mots de passe avant sauvegarde
     * - Permet aussi de comparer un mot de passe en clair avec le hash stocké (matches)
     */
    private final PasswordEncoder passwordEncoder;

    /**
     * ✅ Injection par constructeur (recommandé)
     * - Plus testable
     * - Plus propre que @Autowired sur champs
     */
    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * ✅ Changer le mot de passe pour un utilisateur connecté
     *
     * Logique:
     * 1) Charger l'utilisateur par email
     * 2) Vérifier que l'ancien mot de passe est correct (matches)
     * 3) Encoder le nouveau mot de passe et sauvegarder
     *
     * @param email email de l'utilisateur (souvent auth.getName() depuis Spring Security)
     * @param oldPassword ancien mot de passe saisi par l'utilisateur
     * @param newPassword nouveau mot de passe saisi par l'utilisateur
     */
    public void changePassword(String email, String oldPassword, String newPassword) {

        // 1) Chercher l'utilisateur en base
        // ✅ Si l'email n'existe pas -> 404 (ResourceNotFoundException)
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        // 2) Vérifier l'ancien mot de passe
        // ✅ passwordEncoder.matches compare:
        // - oldPassword (en clair)
        // - user.getPassword() (hash stocké en DB)
        // Si ça ne match pas => l'utilisateur a saisi un ancien mot de passe incorrect
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            // ✅ Exception simple côté API (peut être gérée dans un @ControllerAdvice)
            throw new IllegalArgumentException("Ancien mot de passe incorrect");
        }

        // 3) Encoder et sauvegarder le nouveau mot de passe
        // ✅ Toujours encoder avant de stocker (jamais en clair)
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}