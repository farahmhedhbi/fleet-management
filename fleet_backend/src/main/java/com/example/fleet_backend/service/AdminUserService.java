package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.UserAdminDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.DriverRepository;
import com.example.fleet_backend.repository.PasswordResetTokenRepository;
import com.example.fleet_backend.repository.UserRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Service
@Transactional
public class AdminUserService {
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;

    public AdminUserService(UserRepository userRepository,
                            PasswordResetTokenRepository tokenRepository,
                            DriverRepository driverRepository,
                            VehicleRepository vehicleRepository) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.driverRepository = driverRepository;
        this.vehicleRepository = vehicleRepository;
    }

    public List<UserAdminDTO> list(Boolean enabled) {

        List<User> users = (enabled == null)
                ? userRepository.findAll()
                : userRepository.findAllByEnabled(enabled);

        return users.stream()
                .filter(u -> u.getRole() == null || !"ROLE_ADMIN".equals(u.getRole().getName()))
                .map(this::toDto)
                .toList();
    }

    public UserAdminDTO setEnabled(Long id, boolean value) {

        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        u.setEnabled(value);

        return toDto(userRepository.save(u));
    }


    public void delete(Long id) {

        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        try {

            tokenRepository.deleteByUserId(u.getId());

            driverRepository.deleteByEmail(u.getEmail());

            vehicleRepository.deleteByOwnerId(u.getId());

            userRepository.delete(u);

        } catch (DataIntegrityViolationException ex) {
            throw new IllegalStateException(
                    "Impossible de supprimer l'utilisateur car il est référencé par d'autres données.", ex
            );
        }
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