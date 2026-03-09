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

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DriverRepository driverRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

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

    public AuthResponse authenticateUser(AuthRequest authRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        authRequest.getEmail(),
                        authRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        User user = userRepository.findByEmail(userDetails.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime now = LocalDateTime.now();
        user.setLastLoginAt(now);

        if ("ROLE_OWNER".equals(user.getRoleName())) {

            if (user.getSubscriptionStatus() == User.SubscriptionStatus.ACTIVE) {
                if (user.getPaidUntil() == null || user.getPaidUntil().isBefore(now)) {
                    user.setSubscriptionStatus(User.SubscriptionStatus.EXPIRED);
                }
            }

            if (user.getSubscriptionStatus() == User.SubscriptionStatus.TRIAL) {
                if (user.getTrialEndAt() != null && user.getTrialEndAt().isBefore(now)) {
                    user.setSubscriptionStatus(User.SubscriptionStatus.EXPIRED);
                }
            }
        }

        userRepository.save(user);

        String jwt = jwtUtil.generateJwtToken(authentication);

        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority())
                .orElse(null);

        Instant trialStart = user.getTrialStartAt() == null ? null : user.getTrialStartAt().toInstant(ZoneOffset.UTC);
        Instant trialEnd = user.getTrialEndAt() == null ? null : user.getTrialEndAt().toInstant(ZoneOffset.UTC);
        Instant paidUntil = user.getPaidUntil() == null ? null : user.getPaidUntil().toInstant(ZoneOffset.UTC);

        return new AuthResponse(
                jwt, "Bearer",
                userDetails.getId(),
                userDetails.getEmail(),
                userDetails.getFirstName(),
                userDetails.getLastName(),
                role,
                user.getSubscriptionStatus() == null ? null : user.getSubscriptionStatus().name(),
                trialStart,
                trialEnd,
                paidUntil,
                user.isMustChangePassword()
        );
    }

    @Transactional
    public User registerUser(String firstName, String lastName,
                             String email, String password,
                             String roleName, String licenseNumber) {

        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }

        String cleanEmail = email.trim().toLowerCase();

        // ✅ Email unique
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        // Normaliser roleName
        String normalizedRoleName = normalizeRoleName(roleName);

        // 🚫 Interdire création ADMIN via registerUser()
        if ("ROLE_ADMIN".equals(normalizedRoleName)) {
            throw new IllegalArgumentException("Forbidden: cannot create ADMIN account using this endpoint.");
        }

        // Vérifier que le rôle existe en DB
        Role role = roleRepository.findByName(normalizedRoleName)
                .orElseThrow(() -> new RuntimeException(
                        "Error: Role '" + normalizedRoleName + "' not found."
                ));

        // Construire l'utilisateur
        User user = new User();
        user.setFirstName(firstName != null ? firstName.trim() : "");
        user.setLastName(lastName != null ? lastName.trim() : "");
        user.setEmail(cleanEmail);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setEnabled(true);

        // ✅ Si OWNER => démarrer essai gratuit 30 jours
        if ("ROLE_OWNER".equals(role.getName())) {
            LocalDateTime now = LocalDateTime.now();
            user.setTrialStartAt(now);
            user.setTrialEndAt(now.plusDays(30));
            user.setSubscriptionStatus(User.SubscriptionStatus.TRIAL);
            user.setPaidUntil(null);
        }

        // Sauvegarder user
        User saved = userRepository.save(user);

        // ✅ Si DRIVER => créer Driver + licenseNumber obligatoire
        if ("ROLE_DRIVER".equals(saved.getRole().getName())) {

            String lic = (licenseNumber == null) ? "" : licenseNumber.trim();

            if (lic.isEmpty()) {
                throw new IllegalArgumentException("licenseNumber is required for ROLE_DRIVER");
            }

            if (driverRepository.existsByLicenseNumber(lic)) {
                throw new IllegalArgumentException("licenseNumber already exists");
            }

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

    public String normalizeRoleNamePublic(String roleName) {
        return normalizeRoleName(roleName);
    }

    private String normalizeRoleName(String roleName) {
        if (roleName == null || roleName.trim().isEmpty()) {
            throw new RuntimeException("Role name cannot be empty");
        }

        String r = roleName.trim().toUpperCase();

        if (!r.startsWith("ROLE_")) {
            r = "ROLE_" + r;
        }
        return r;
    }
}