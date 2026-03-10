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

        // ✅ Si enabled est null => pas de filtre
        List<User> users = (enabled == null)
                ? userRepository.findAll()
                : userRepository.findAllByEnabled(enabled);

        // ✅ Mapper Entity -> DTO pour éviter d'exposer l'entité directement
        return users.stream()
                .filter(u -> u.getRole() == null || !"ROLE_ADMIN".equals(u.getRole().getName()))
                .map(this::toDto)
                .toList();
    }

    public UserAdminDTO setEnabled(Long id, boolean value) {

        // 404 si user introuvable
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Mettre à jour le statut
        u.setEnabled(value);

        // Sauvegarder et retourner DTO
        return toDto(userRepository.save(u));
    }


    public void delete(Long id) {

        // 404 si introuvable
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        try {
            // ✅ 1) supprimer tokens reset/activation liés au user
            // (évite token orphelin et problèmes FK si relation existe)
            tokenRepository.deleteByUserId(u.getId());

            // ✅ 2) supprimer profil driver si existe (liée par email)
            // (si le user est driver, la table drivers peut dépendre du user)
            driverRepository.deleteByEmail(u.getEmail());

            vehicleRepository.deleteByOwnerId(u.getId());

            // ✅ 4) supprimer le user à la fin
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