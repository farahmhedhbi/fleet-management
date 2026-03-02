package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.*;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.Role;
import com.example.fleet_backend.model.Role.ERole;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.DriverRepository;
import com.example.fleet_backend.repository.PaymentRepository;
import com.example.fleet_backend.repository.RoleRepository;
import com.example.fleet_backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
    private final PaymentRepository paymentRepository;

    public AdminService(UserRepository userRepository,
                        RoleRepository roleRepository,
                        DriverRepository driverRepository,
                        PasswordEncoder passwordEncoder,
                        PasswordResetService passwordResetService ,
                        PaymentRepository paymentRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.driverRepository = driverRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordResetService = passwordResetService;
        this.paymentRepository = paymentRepository;
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

        if (req == null) throw new IllegalArgumentException("Request is required");
        if (req.email == null || req.email.isBlank()) throw new IllegalArgumentException("Email is required");
        if (req.firstName == null || req.firstName.isBlank()) throw new IllegalArgumentException("First name is required");
        if (req.lastName == null || req.lastName.isBlank()) throw new IllegalArgumentException("Last name is required");
        if (req.role == null || req.role.isBlank()) throw new IllegalArgumentException("Role is required");

        if (userRepository.existsByEmail(req.email.trim().toLowerCase())) {
            throw new IllegalArgumentException("Email already exists");
        }

        if (req.password == null || req.password.isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }

        ERole roleEnum = parseRole(req.role);

        Role role = roleRepository.findByName(roleEnum)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleEnum));

        User u = new User();
        u.setFirstName(req.firstName.trim());
        u.setLastName(req.lastName.trim());
        u.setEmail(req.email.trim().toLowerCase());
        u.setRole(role);
        u.setPassword(passwordEncoder.encode(req.password));
        u.setEnabled(true);

        User saved = userRepository.save(u);

        // ✅ IMPORTANT: utiliser req.licenseNumber si DRIVER
        maybeCreateOrUpdateDriverProfile(saved, null);

        return new UserDTO(saved);
    }

    public UserDTO updateUser(Long id, UpdateUserRequest req) {

        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        if (req.email != null && !req.email.equalsIgnoreCase(u.getEmail())) {
            String newEmail = req.email.trim().toLowerCase();
            if (userRepository.existsByEmail(newEmail)) {
                throw new IllegalArgumentException("Email already exists");
            }
            u.setEmail(newEmail);
        }

        if (req.firstName != null) u.setFirstName(req.firstName.trim());
        if (req.lastName != null) u.setLastName(req.lastName.trim());

        if (req.role != null && !req.role.isBlank()) {
            ERole roleEnum = parseRole(req.role);
            Role role = roleRepository.findByName(roleEnum)
                    .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleEnum));
            u.setRole(role);
        }

        if (req.password != null && !req.password.isBlank()) {
            u.setPassword(passwordEncoder.encode(req.password));
        }

        User saved = userRepository.save(u);

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

        String email = req.email.trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        ERole roleEnum = parseRole(req.role);

        Role role = roleRepository.findByName(roleEnum)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleEnum));

        User u = new User();
        u.setFirstName(req.firstName.trim());
        u.setLastName(req.lastName.trim());
        u.setEmail(email);
        u.setRole(role);

        String temp = UUID.randomUUID() + "-" + UUID.randomUUID();
        u.setPassword(passwordEncoder.encode(temp));
        u.setEnabled(false);

        User saved = userRepository.save(u);

        maybeCreateOrUpdateDriverProfile(saved, req.licenseNumber);

        passwordResetService.createActivationTokenAndSendEmail(saved.getEmail());

        return new UserDTO(saved);
    }

    private void maybeCreateOrUpdateDriverProfile(User user, String licenseNumber) {
        if (user == null || user.getRole() == null) return;

        ERole roleEnum = ERole.valueOf(user.getRole().getName());// ✅ c'est ERole
        if (roleEnum != ERole.ROLE_DRIVER) return;

        String lic = (licenseNumber == null) ? "" : licenseNumber.trim();
        if (lic.isEmpty()) {
            throw new IllegalArgumentException("licenseNumber is required for ROLE_DRIVER");
        }

        Driver existing = driverRepository.findByEmail(user.getEmail()).orElse(null);
        if (existing != null) {
            if (!lic.equals(existing.getLicenseNumber()) && driverRepository.existsByLicenseNumber(lic)) {
                throw new IllegalArgumentException("licenseNumber already exists");
            }
            existing.setFirstName(user.getFirstName());
            existing.setLastName(user.getLastName());
            existing.setLicenseNumber(lic);
            driverRepository.save(existing);
            return;
        }

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

    private ERole parseRole(String role) {
        String r = role.trim().toUpperCase();
        if (!r.startsWith("ROLE_")) r = "ROLE_" + r;

        try {
            return ERole.valueOf(r);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Unknown role: " + role);
        }
    }

    public  List<PaymentDTO> listPaymentsForUser(Long userId) {
        // vérifie user existe
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        return paymentRepository.findByUserIdOrderByPaidAtDesc(userId).stream()
                .map(PaymentDTO::new)
                .collect(Collectors.toList());
    }

    public UserDTO activateOwnerSubscription(Long userId, ActivateSubscriptionRequest req) {

        if (req == null) req = new ActivateSubscriptionRequest();

        int months = (req.months == null) ? 1 : req.months;
        if (months <= 0) throw new IllegalArgumentException("months must be > 0");

        if (req.method == null) throw new IllegalArgumentException("method is required");
        if (req.amount == null || req.amount <= 0) throw new IllegalArgumentException("amount must be > 0");

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // ✅ Seulement OWNER
        if (!"ROLE_OWNER".equals(user.getRoleName())) {
            throw new IllegalArgumentException("Only OWNER can be activated");
        }

        LocalDateTime now = LocalDateTime.now();

        // ✅ enregistrer le paiement (trace)
        com.example.fleet_backend.model.Payment p = new com.example.fleet_backend.model.Payment();
        p.setUser(user);
        p.setMonths(months);
        p.setAmount(req.amount);
        p.setMethod(req.method);
        p.setReference(req.reference);
        p.setNote(req.note);
        p.setPaidAt(now);
        paymentRepository.save(p);

        // ✅ activer / prolonger abonnement
        LocalDateTime base = (user.getPaidUntil() != null && user.getPaidUntil().isAfter(now))
                ? user.getPaidUntil()
                : now;

        user.setSubscriptionStatus(User.SubscriptionStatus.ACTIVE);
        user.setPaidUntil(base.plusMonths(months));

        User saved = userRepository.save(user);
        return new UserDTO(saved);
    }
}