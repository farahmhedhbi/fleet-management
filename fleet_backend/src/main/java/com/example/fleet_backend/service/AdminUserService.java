package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.UserAdminDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class AdminUserService {

    private final UserRepository userRepository;

    public AdminUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserAdminDTO> list(Boolean enabled) {
        List<User> users = (enabled == null)
                ? userRepository.findAll()
                : userRepository.findAllByEnabled(enabled);

        return users.stream().map(this::toDto).toList();
    }

    public UserAdminDTO setEnabled(Long id, boolean value) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        u.setEnabled(value);
        return toDto(userRepository.save(u));
    }

    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found");
        }
        userRepository.deleteById(id);
    }

    private UserAdminDTO toDto(User u) {
        UserAdminDTO dto = new UserAdminDTO();
        dto.id = u.getId();
        dto.firstName = u.getFirstName();
        dto.lastName = u.getLastName();
        dto.email = u.getEmail();
        dto.role = (u.getRole() != null ? u.getRole().getName() : null);
        dto.enabled = u.isEnabled();
        dto.lastLoginAt = u.getLastLoginAt();
        return dto;
    }
}
