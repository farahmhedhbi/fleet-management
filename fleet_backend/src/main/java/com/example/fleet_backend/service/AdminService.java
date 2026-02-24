package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.AdminInviteUserRequest;
import com.example.fleet_backend.dto.CreateUserRequest;
import com.example.fleet_backend.dto.UpdateUserRequest;
import com.example.fleet_backend.dto.UserDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.Role;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.DriverRepository;
import com.example.fleet_backend.repository.RoleRepository;
import com.example.fleet_backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * ✅ AdminService
 *
 * Service métier dédié aux actions d'administration sur les utilisateurs.
 *
 * Fonctionnalités principales:
 * 1) Lister les owners / lister tous les users
 * 2) CRUD utilisateur (create / read / update / delete)
 * 3) Invitation d’un utilisateur (inviteUser):
 *    - crée un compte désactivé (enabled=false)
 *    - génère un mot de passe temporaire (inutilisé)
 *    - envoie un email d’activation via PasswordResetService
 * 4) Gestion du profil Driver quand role = ROLE_DRIVER:
 *    - licenseNumber obligatoire
 *    - création ou mise à jour du Driver profile (table drivers)
 *
 * @Transactional:
 * - assure cohérence sur des opérations multi-étapes (user + driver + email token)
 * - rollback si une règle métier échoue (email existant, licenseNumber dupliqué, etc.)
 */
@Service
@Transactional
public class AdminService {

    /**
     * ✅ Repositories / services utilisés:
     * - UserRepository: gestion table users
     * - RoleRepository: vérification existence du rôle
     * - DriverRepository: création / MAJ profil driver
     * - PasswordEncoder: encoder les mots de passe (temporaire ou défini)
     * - PasswordResetService: envoi email activation via token
     */
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DriverRepository driverRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetService passwordResetService;

    /**
     * ✅ Injection par constructeur (bonne pratique)
     */
    public AdminService(UserRepository userRepository,
                        RoleRepository roleRepository,
                        DriverRepository driverRepository,
                        PasswordEncoder passwordEncoder,
                        PasswordResetService passwordResetService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.driverRepository = driverRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordResetService = passwordResetService;
    }

    /**
     * ✅ Lister uniquement les "owners"
     * (nécessite une méthode custom: userRepository.findAllOwners())
     */
    public List<UserDTO> listOwners() {
        return userRepository.findAllOwners().stream()
                .map(UserDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * ✅ Lister tous les utilisateurs
     */
    public List<UserDTO> listUsers() {
        return userRepository.findAll().stream()
                .map(UserDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * ✅ Récupérer un utilisateur par ID
     * @throws ResourceNotFoundException si introuvable
     */
    public UserDTO getUser(Long id) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        return new UserDTO(u);
    }

    /**
     * ✅ Créer un utilisateur (avec mot de passe fourni)
     *
     * Règles:
     * - email unique
     * - rôle doit exister
     * - password obligatoire
     * - enabled=true (compte actif immédiatement)
     * - si ROLE_DRIVER => profil Driver obligatoire (licenseNumber, selon ton design)
     */
    public UserDTO createUser(CreateUserRequest req) {

        // ✅ Vérifier unicité email
        if (userRepository.existsByEmail(req.email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        // ✅ Vérifier que le rôle existe
        Role role = roleRepository.findByName(req.role)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + req.role));

        // Construire l'entité User
        User u = new User();
        u.setFirstName(req.firstName);
        u.setLastName(req.lastName);
        u.setEmail(req.email);
        u.setRole(role);

        // ✅ Password obligatoire
        if (req.password == null || req.password.isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }

        // ✅ Encoder password
        u.setPassword(passwordEncoder.encode(req.password));

        // ✅ Compte actif directement
        u.setEnabled(true);

        User saved = userRepository.save(u);

        // ✅ Si ROLE_DRIVER => créer/MAJ driver profile
        // Ici tu passes null, donc si ton CreateUserRequest contient licenseNumber,
        // elle n'est pas utilisée dans ce createUser (choix actuel du code).
        maybeCreateOrUpdateDriverProfile(saved, null);

        return new UserDTO(saved);
    }

    /**
     * ✅ Mettre à jour un utilisateur
     *
     * Points importants:
     * - email: si changé => vérifier unicité
     * - rôle: si changé => vérifier existence
     * - password: si fourni => encoder puis sauvegarder
     * - driver profile: si role=ROLE_DRIVER => licenseNumber obligatoire + update/create
     */
    public UserDTO updateUser(Long id, UpdateUserRequest req) {

        // 404 si user introuvable
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        // ✅ Mise à jour email avec contrôle d'unicité
        if (req.email != null && !req.email.equals(u.getEmail())) {
            if (userRepository.existsByEmail(req.email)) {
                throw new IllegalArgumentException("Email already exists");
            }
            u.setEmail(req.email);
        }

        // ✅ Mise à jour nom/prénom si fournis
        if (req.firstName != null) u.setFirstName(req.firstName);
        if (req.lastName != null) u.setLastName(req.lastName);

        // ✅ Mise à jour rôle si fourni
        if (req.role != null) {
            Role role = roleRepository.findByName(req.role)
                    .orElseThrow(() -> new IllegalArgumentException("Role not found: " + req.role));
            u.setRole(role);
        }

        // ✅ Mise à jour password si fourni (et non vide)
        if (req.password != null && !req.password.isBlank()) {
            u.setPassword(passwordEncoder.encode(req.password));
        }

        // Sauvegarder user
        User saved = userRepository.save(u);

        // ✅ IMPORTANT: prendre en compte req.licenseNumber pour DRIVER
        maybeCreateOrUpdateDriverProfile(saved, req.licenseNumber);

        return new UserDTO(saved);
    }

    /**
     * ✅ Supprimer un utilisateur (delete simple)
     *
     * ⚠️ Ici: suppression directe sans supprimer tokens/driver/vehicles
     * (différent de AdminUserService.delete qui nettoie les dépendances)
     */
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found: " + id);
        }
        userRepository.deleteById(id);
    }

    /**
     * ✅ Inviter un utilisateur (création + email d'activation)
     *
     * Idée:
     * - L'admin crée un compte sans mot de passe réel (temp aléatoire)
     * - enabled=false (compte inactif)
     * - Envoie un lien d'activation (token) par email
     * - L'utilisateur active son compte et définit son mot de passe via le frontend
     *
     * Validation stricte des champs pour éviter un compte incomplet.
     */
    public UserDTO inviteUser(AdminInviteUserRequest req) {

        // ✅ Validation request
        if (req == null) throw new IllegalArgumentException("Request is required");
        if (req.email == null || req.email.isBlank()) throw new IllegalArgumentException("Email is required");
        if (req.firstName == null || req.firstName.isBlank()) throw new IllegalArgumentException("First name is required");
        if (req.lastName == null || req.lastName.isBlank()) throw new IllegalArgumentException("Last name is required");
        if (req.role == null || req.role.isBlank()) throw new IllegalArgumentException("Role is required");

        // ✅ Email unique
        if (userRepository.existsByEmail(req.email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        // ✅ Rôle existe
        Role role = roleRepository.findByName(req.role)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + req.role));

        // Construire user
        User u = new User();
        u.setFirstName(req.firstName.trim());
        u.setLastName(req.lastName.trim());

        // Normaliser email (minuscule)
        u.setEmail(req.email.trim().toLowerCase());
        u.setRole(role);

        /**
         * ✅ Mot de passe temporaire:
         * - jamais utilisé réellement par l'utilisateur
         * - juste pour satisfaire la contrainte "password non null"
         */
        String temp = UUID.randomUUID() + "-" + UUID.randomUUID();
        u.setPassword(passwordEncoder.encode(temp));

        // ✅ Compte inactif jusqu'à activation
        u.setEnabled(false);

        User saved = userRepository.save(u);

        // ✅ si DRIVER -> license obligatoire + driver profile
        maybeCreateOrUpdateDriverProfile(saved, req.licenseNumber);

        // ✅ Envoi lien activation via token (24h côté PasswordResetService)
        passwordResetService.createActivationTokenAndSendEmail(saved.getEmail());

        return new UserDTO(saved);
    }

    /**
     * ✅ Crée ou met à jour Driver profile si role=ROLE_DRIVER.
     *
     * Pourquoi cette méthode existe ?
     * - Séparer la logique Driver (licenseNumber, profil drivers) du reste
     * - Réutilisée dans createUser/updateUser/inviteUser
     *
     * Règles:
     * - ROLE_DRIVER => licenseNumber obligatoire
     * - licenseNumber unique (pas de duplication)
     * - si driver existe déjà => update (nom/prénom/licence)
     * - sinon => create
     */
    private void maybeCreateOrUpdateDriverProfile(User user, String licenseNumber) {
        if (user == null || user.getRole() == null) return;

        // ✅ On ne s'occupe du profil Driver que si rôle = ROLE_DRIVER
        String roleName = user.getRole().getName();
        if (!"ROLE_DRIVER".equals(roleName)) return;

        // licenseNumber obligatoire
        String lic = (licenseNumber == null) ? "" : licenseNumber.trim();
        if (lic.isEmpty()) {
            throw new IllegalArgumentException("licenseNumber is required for ROLE_DRIVER");
        }

        // ✅ Si un driver profile existe déjà => update
        Driver existing = driverRepository.findByEmail(user.getEmail()).orElse(null);
        if (existing != null) {

            // Éviter collision licenseNumber si modifié
            if (!lic.equals(existing.getLicenseNumber()) && driverRepository.existsByLicenseNumber(lic)) {
                throw new IllegalArgumentException("licenseNumber already exists");
            }

            existing.setFirstName(user.getFirstName());
            existing.setLastName(user.getLastName());
            existing.setLicenseNumber(lic);

            driverRepository.save(existing);
            return;
        }

        // ✅ Sinon: créer nouveau profil Driver

        // Vérifier unicité licenseNumber
        if (driverRepository.existsByLicenseNumber(lic)) {
            throw new IllegalArgumentException("licenseNumber already exists");
        }

        Driver d = new Driver();
        d.setEmail(user.getEmail());
        d.setFirstName(user.getFirstName());
        d.setLastName(user.getLastName());
        d.setLicenseNumber(lic);

        driverRepository.save(d);
    }
}