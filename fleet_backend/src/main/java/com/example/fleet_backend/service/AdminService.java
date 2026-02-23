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

    public List<UserDTO> listUsers() {
        return userRepository.findAll().stream()
                .map(UserDTO::new)
                .collect(Collectors.toList());
    }

    public UserDTO getUser(Long id) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        return new UserDTO(u);
    }

    public UserDTO createUser(CreateUserRequest req) {
        if (userRepository.existsByEmail(req.email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        Role role = roleRepository.findByName(req.role)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + req.role));

        User u = new User();
        u.setFirstName(req.firstName);
        u.setLastName(req.lastName);
        u.setEmail(req.email);
        u.setRole(role);

        if (req.password == null || req.password.isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
        u.setPassword(passwordEncoder.encode(req.password));
        u.setEnabled(true);

        User saved = userRepository.save(u);

        // si ROLE_DRIVER => licenseNumber doit exister (si ton CreateUserRequest l’a)
        maybeCreateOrUpdateDriverProfile(saved, null);

        return new UserDTO(saved);
    }

    public UserDTO updateUser(Long id, UpdateUserRequest req) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        if (req.email != null && !req.email.equals(u.getEmail())) {
            if (userRepository.existsByEmail(req.email)) {
                throw new IllegalArgumentException("Email already exists");
            }
            u.setEmail(req.email);
        }

        if (req.firstName != null) u.setFirstName(req.firstName);
        if (req.lastName != null) u.setLastName(req.lastName);

        if (req.role != null) {
            Role role = roleRepository.findByName(req.role)
                    .orElseThrow(() -> new IllegalArgumentException("Role not found: " + req.role));
            u.setRole(role);
        }

        if (req.password != null && !req.password.isBlank()) {
            u.setPassword(passwordEncoder.encode(req.password));
        }

        User saved = userRepository.save(u);

        // ✅ IMPORTANT: prendre en compte req.licenseNumber
        maybeCreateOrUpdateDriverProfile(saved, req.licenseNumber);

        return new UserDTO(saved);
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found: " + id);
        }
        userRepository.deleteById(id);
    }

    public UserDTO inviteUser(AdminInviteUserRequest req) {
        if (req == null) throw new IllegalArgumentException("Request is required");
        if (req.email == null || req.email.isBlank()) throw new IllegalArgumentException("Email is required");
        if (req.firstName == null || req.firstName.isBlank()) throw new IllegalArgumentException("First name is required");
        if (req.lastName == null || req.lastName.isBlank()) throw new IllegalArgumentException("Last name is required");
        if (req.role == null || req.role.isBlank()) throw new IllegalArgumentException("Role is required");

        if (userRepository.existsByEmail(req.email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        Role role = roleRepository.findByName(req.role)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + req.role));

        User u = new User();
        u.setFirstName(req.firstName.trim());
        u.setLastName(req.lastName.trim());
        u.setEmail(req.email.trim().toLowerCase());
        u.setRole(role);

        String temp = UUID.randomUUID() + "-" + UUID.randomUUID();
        u.setPassword(passwordEncoder.encode(temp));
        u.setEnabled(false);

        User saved = userRepository.save(u);

        // ✅ si DRIVER -> license obligatoire + driver profile
        maybeCreateOrUpdateDriverProfile(saved, req.licenseNumber);

        passwordResetService.createActivationTokenAndSendEmail(saved.getEmail());

        return new UserDTO(saved);
    }

    /**
     * ✅ Crée ou met à jour Driver profile si role=ROLE_DRIVER.
     */
    private void maybeCreateOrUpdateDriverProfile(User user, String licenseNumber) {
        if (user == null || user.getRole() == null) return;

        String roleName = user.getRole().getName();
        if (!"ROLE_DRIVER".equals(roleName)) return;

        String lic = (licenseNumber == null) ? "" : licenseNumber.trim();
        if (lic.isEmpty()) {
            throw new IllegalArgumentException("licenseNumber is required for ROLE_DRIVER");
        }

        // si un driver profile existe, on update
        Driver existing = driverRepository.findByEmail(user.getEmail()).orElse(null);
        if (existing != null) {
            // éviter collision licenseNumber si changé
            if (!lic.equals(existing.getLicenseNumber()) && driverRepository.existsByLicenseNumber(lic)) {
                throw new IllegalArgumentException("licenseNumber already exists");
            }
            existing.setFirstName(user.getFirstName());
            existing.setLastName(user.getLastName());
            existing.setLicenseNumber(lic);
            driverRepository.save(existing);
            return;
        }

        // sinon on crée
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