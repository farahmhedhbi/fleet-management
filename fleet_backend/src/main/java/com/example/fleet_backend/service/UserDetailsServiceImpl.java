package com.example.fleet_backend.service;

import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.UserRepository;
import com.example.fleet_backend.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * ✅ UserDetailsServiceImpl
 *
 * Rôle très important dans Spring Security.
 *
 * Cette classe est utilisée automatiquement par Spring Security
 * lors de l’authentification (login).
 *
 * Elle permet de:
 * 1) Charger l'utilisateur depuis la base de données
 * 2) Transformer l'entité User en UserDetails (format compris par Spring Security)
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    /**
     * ✅ UserRepository:
     * - Permet de récupérer l'utilisateur depuis la base
     * - Ici on cherche par email (car email = username dans ton système)
     *
     * ⚠️ @Autowired fonctionne,
     * mais l'injection par constructeur est recommandée en général.
     */
    @Autowired
    private UserRepository userRepository;

    /**
     * ✅ Méthode appelée automatiquement par Spring Security
     * lors du processus d’authentification.
     *
     * Quand un utilisateur essaie de se connecter:
     * - Spring appelle cette méthode
     * - Elle doit retourner un objet UserDetails
     *
     * @param email = username (dans ton cas, email)
     * @return UserDetails (objet compatible Spring Security)
     */
    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        // 1️⃣ Chercher l'utilisateur par email
        // Si non trouvé -> exception Spring Security
        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found with email: " + email));

        /**
         * 2️⃣ Transformer l'entité User en UserDetails
         *
         * UserDetailsImpl.build(user) :
         * - Récupère id, email, password
         * - Récupère les rôles
         * - Construit un objet utilisable par Spring Security
         */
        return UserDetailsImpl.build(user);
    }
}