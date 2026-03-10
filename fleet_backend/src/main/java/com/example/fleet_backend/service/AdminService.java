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


@Service
@Transactional
public class AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DriverRepository driverRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetService passwordResetService;


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


    public List<UserDTO> listOwners() {
        return userRepository.findAllOwners().stream()
                .map(UserDTO::new)
                .collect(Collectors.toList());
    }


    public UserDTO getUser(Long id) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        return new UserDTO(u);
    }

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