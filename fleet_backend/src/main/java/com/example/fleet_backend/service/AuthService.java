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

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DriverRepository driverRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // ✅ Constructor injection (meilleur que @Autowired)
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

        // 1️⃣ Authentification (vérifie email + password)
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        authRequest.getEmail(),
                        authRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 2️⃣ Récupérer l'utilisateur connecté
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        // 3️⃣ ✅ Mettre à jour lastLoginAt (APRÈS login réussi)
        User user = userRepository.findByEmail(userDetails.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // 4️⃣ Générer JWT
        String jwt = jwtUtil.generateJwtToken(authentication);

        // 5️⃣ Récupérer le rôle
        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority())
                .orElse(null);

        // 6️⃣ Retourner réponse
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


    @Transactional
    public User registerUser(String firstName, String lastName,
                             String email, String password,
                             String roleName, String licenseNumber) {

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        String normalizedRoleName = normalizeRoleName(roleName);

        Role role = roleRepository.findByName(normalizedRoleName)
                .orElseThrow(() -> new RuntimeException(
                        "Error: Role '" + normalizedRoleName + "' not found. Available: ROLE_ADMIN, ROLE_OWNER, ROLE_DRIVER"
                ));

        User user = new User();
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);

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
