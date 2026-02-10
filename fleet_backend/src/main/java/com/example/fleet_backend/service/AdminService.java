package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.CreateUserRequest;
import com.example.fleet_backend.dto.UpdateUserRequest;
import com.example.fleet_backend.dto.UserDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Role;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.RoleRepository;
import com.example.fleet_backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(UserRepository userRepository,
                        RoleRepository roleRepository,
                        PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ===== Owners =====
    public List<UserDTO> listOwners() {
        return userRepository.findAllOwners().stream()
                .map(UserDTO::new)
                .collect(Collectors.toList());
    }

    // ===== Users CRUD =====
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
        u.setPassword(passwordEncoder.encode(req.password));

        return new UserDTO(userRepository.save(u));
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

        return new UserDTO(userRepository.save(u));
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found: " + id);
        }
        userRepository.deleteById(id);
    }
}

