package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.AuthRequest;
import com.example.fleet_backend.dto.AuthResponse;
import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.Role;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.DriverRepository;
import com.example.fleet_backend.repository.RoleRepository;
import com.example.fleet_backend.repository.UserRepository;
import com.example.fleet_backend.security.JwtUtil;
import com.example.fleet_backend.security.UserDetailsImpl;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * ✅ AuthService
 *
 * Service central de l’authentification et de l’inscription.
 *
 * Fonctionnalités:
 * 1) 🔐 authenticateUser(...) : login + génération du JWT
 * 2) 🧾 registerUser(...)      : inscription + création automatique Driver si ROLE_DRIVER
 * 3) normalizeRoleName(...)    : normalisation des rôles (ex: "driver" => "ROLE_DRIVER")
 *
 * Pourquoi un service dédié ?
 * - Isoler la logique de sécurité (auth/register) du Controller
 * - Centraliser les règles métier (ex: licenseNumber obligatoire pour DRIVER)
 */
@Service
public class AuthService {

    /**
     * ✅ AuthenticationManager:
     * - composant Spring Security chargé de vérifier email/password
     * - il utilise UserDetailsServiceImpl + PasswordEncoder derrière
     */
    private final AuthenticationManager authenticationManager;

    /**
     * ✅ Repositories:
     * - UserRepository: CRUD users, recherche par email, lastLoginAt...
     * - RoleRepository: récupérer le rôle en DB
     * - DriverRepository: créer Driver profile quand rôle = DRIVER
     */
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DriverRepository driverRepository;

    /**
     * ✅ PasswordEncoder:
     * - encode (hash) mot de passe lors de register
     * - matches (comparaison) lors de login via AuthenticationManager
     */
    private final PasswordEncoder passwordEncoder;

    /**
     * ✅ JwtUtil:
     * - génère le token JWT après authentification réussie
     * - contient la clé secrète + expiration
     */
    private final JwtUtil jwtUtil;

    /**
     * ✅ Constructor injection (meilleur que @Autowired)
     * - plus propre
     * - plus testable
     */
    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       RoleRepository roleRepository,
                       DriverRepository driverRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.driverRepository = driverRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    /**
     * ✅ Authentification (Login)
     *
     * Flow complet:
     * 1) Spring Security vérifie email/password via AuthenticationManager
     * 2) Si OK -> SecurityContextHolder contient l'utilisateur authentifié
     * 3) On récupère UserDetailsImpl (infos user + rôle)
     * 4) ✅ Mise à jour lastLoginAt (historique de connexion)
     * 5) Génération JWT (token)
     * 6) Retour AuthResponse (token + infos user)
     *
     * @param authRequest contient email + password
     * @return AuthResponse (JWT + infos user)
     */
    public AuthResponse authenticateUser(AuthRequest authRequest) {

        // 1️⃣ Authentification (vérifie email + password)
        // ⚠️ Si mauvais mot de passe => exception Spring Security
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        authRequest.getEmail(),
                        authRequest.getPassword()
                )
        );

        // Met l'utilisateur authentifié dans le contexte de sécurité
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 2️⃣ Récupérer l'utilisateur connecté (objet Security)
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        // 3️⃣ ✅ Mettre à jour lastLoginAt (APRÈS login réussi)
        // Utile pour Admin "Comptes actifs" / audit / suivi activité
        User user = userRepository.findByEmail(userDetails.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // 4️⃣ Générer JWT
        // Le token sera utilisé ensuite dans Authorization: Bearer <token>
        String jwt = jwtUtil.generateJwtToken(authentication);

        // 5️⃣ Récupérer le rôle (première authority)
        // Ex: ROLE_ADMIN / ROLE_OWNER / ROLE_DRIVER
        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority())
                .orElse(null);

        // 6️⃣ Retourner réponse au frontend
        return new AuthResponse(
                jwt,
                "Bearer",
                userDetails.getId(),
                userDetails.getEmail(),
                userDetails.getFirstName(),
                userDetails.getLastName(),
                role
        );
    }

    /**
     * ✅ Inscription / Création utilisateur
     *
     * Règles métier importantes:
     * - email doit être unique
     * - roleName est normalisé en format "ROLE_XXX"
     * - le rôle doit exister en base (table roles)
     * - si rôle = ROLE_DRIVER:
     *   * licenseNumber est OBLIGATOIRE
     *   * licenseNumber doit être unique
     *   * crée aussi un Driver profile (table drivers)
     *
     * @Transactional:
     * - si une étape échoue (ex: licenseNumber déjà existant),
     *   toute l'opération est annulée (rollback)
     */
    @Transactional
    public User registerUser(String firstName, String lastName,
                             String email, String password,
                             String roleName, String licenseNumber) {

        // ✅ Email unique
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        // Normaliser roleName (ex: "driver" => "ROLE_DRIVER")
        String normalizedRoleName = normalizeRoleName(roleName);

        // Vérifier que le rôle existe en DB
        Role role = roleRepository.findByName(normalizedRoleName)
                .orElseThrow(() -> new RuntimeException(
                        "Error: Role '" + normalizedRoleName + "' not found. Available: ROLE_ADMIN, ROLE_OWNER, ROLE_DRIVER"
                ));

        // Construire l'utilisateur
        User user = new User();
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(email);

        // ✅ Encoder le mot de passe (ne jamais stocker en clair)
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);

        // Sauvegarder user
        User saved = userRepository.save(user);

        // ✅ Si DRIVER => créer Driver + licenseNumber obligatoire
        if ("ROLE_DRIVER".equals(saved.getRole().getName())) {

            // Nettoyage licenseNumber
            String lic = (licenseNumber == null) ? "" : licenseNumber.trim();

            // licenseNumber obligatoire
            if (lic.isEmpty()) {
                throw new IllegalArgumentException("licenseNumber is required for ROLE_DRIVER");
            }

            // licenseNumber unique
            if (driverRepository.existsByLicenseNumber(lic)) {
                throw new IllegalArgumentException("licenseNumber already exists");
            }

            // Créer profil Driver si absent
            if (!driverRepository.existsByEmail(saved.getEmail())) {
                Driver d = new Driver();
                d.setEmail(saved.getEmail());
                d.setFirstName(saved.getFirstName());
                d.setLastName(saved.getLastName());
                d.setLicenseNumber(lic);
                driverRepository.save(d);
            }
        }

        return saved;
    }

    /**
     * ✅ Méthode exposée publiquement (utile si Controller veut normaliser un rôle)
     * - Elle appelle la méthode privée normalizeRoleName
     */
    public String normalizeRoleNamePublic(String roleName) {
        return normalizeRoleName(roleName);
    }

    /**
     * ✅ Normaliser un rôle
     *
     * Exemples:
     * - "driver" -> "ROLE_DRIVER"
     * - "ROLE_owner" -> "ROLE_OWNER"
     *
     * Règle:
     * - roleName non vide
     * - majuscules
     * - préfixe "ROLE_" ajouté si absent
     */
    private String normalizeRoleName(String roleName) {
        if (roleName == null || roleName.trim().isEmpty()) {
            throw new RuntimeException("Role name cannot be empty");
        }

        String r = roleName.trim().toUpperCase();

        // Ajouter prefix si absent
        if (!r.startsWith("ROLE_")) {
            r = "ROLE_" + r;
        }
        return r;
    }
}