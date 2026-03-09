package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.AdminInviteOwnerRequest;
import com.example.fleet_backend.dto.UserDTO;
import com.example.fleet_backend.model.Role;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.RoleRepository;
import com.example.fleet_backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Transactional
public class AdminInvitationService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordGeneratorService passwordGeneratorService;
    private final EmailService emailService;

    public AdminInvitationService(UserRepository userRepository,
                                  RoleRepository roleRepository,
                                  PasswordEncoder passwordEncoder,
                                  PasswordGeneratorService passwordGeneratorService,
                                  EmailService emailService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordGeneratorService = passwordGeneratorService;
        this.emailService = emailService;
    }

    public UserDTO inviteOwner(AdminInviteOwnerRequest req) {
        String email = normalizeEmail(req.getEmail());

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Email already used");
        }

        Role ownerRole = roleRepository.findByName("ROLE_OWNER")
                .orElseThrow(() -> new IllegalStateException("ROLE_OWNER not found"));

        String tempPassword = passwordGeneratorService.generateTemporaryPassword(12);

        User user = new User();
        user.setFirstName(trim(req.getFirstName()));
        user.setLastName(trim(req.getLastName()));
        user.setEmail(email);
        user.setPhone(trim(req.getPhone()));
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setRole(ownerRole);
        user.setEnabled(true);
        user.setMustChangePassword(true);

        LocalDateTime now = LocalDateTime.now();
        user.setTrialStartAt(now);
        user.setTrialEndAt(now.plusDays(30));
        user.setSubscriptionStatus(User.SubscriptionStatus.TRIAL);
        user.setPaidUntil(null);

        User saved = userRepository.save(user);

        emailService.sendOwnerInvitationEmail(
                saved.getEmail(),
                saved.getFirstName(),
                saved.getEmail(),
                tempPassword
        );

        return new UserDTO(saved);
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        return email.trim().toLowerCase();
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }
}