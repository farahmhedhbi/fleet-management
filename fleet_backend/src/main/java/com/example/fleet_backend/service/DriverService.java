package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.CreateDriverByOwnerRequest;
import com.example.fleet_backend.dto.DriverDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.Role;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.DriverRepository;
import com.example.fleet_backend.repository.RoleRepository;
import com.example.fleet_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * ✅ DriverService
 *
 * Service métier pour gérer les conducteurs (Drivers).
 *
 * Fonctions principales:
 * - Consulter le profil du conducteur connecté (My Profile)
 * - CRUD complet sur les conducteurs (create, read, update, delete)
 *
 * @Service:
 * - Composant Spring injectable (couche métier).
 *
 * @Transactional:
 * - Toutes les opérations DB sont transactionnelles
 * - En cas d'erreur, rollback automatique (cohérence des données).
 */
@Service
@Transactional
public class DriverService {
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final TemporaryPasswordService temporaryPasswordService;
    private final EmailService emailService;
    private final SmsService smsService;
    private final PasswordGeneratorService passwordGeneratorService;

    public DriverService(DriverRepository driverRepository,
                         UserRepository userRepository,
                         RoleRepository roleRepository,
                         PasswordEncoder passwordEncoder,
                         TemporaryPasswordService temporaryPasswordService,
                         EmailService emailService,
                         PasswordGeneratorService passwordGeneratorService,
                         SmsService smsService) {
        this.driverRepository = driverRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.temporaryPasswordService = temporaryPasswordService;
        this.emailService = emailService;
        this.smsService = smsService;
        this.passwordGeneratorService = passwordGeneratorService;
    }


    /**
     * ✅ Retourne le profil du conducteur connecté
     *
     * Idée:
     * - Authentication contient l'identité du user connecté
     * - auth.getName() retourne l'email (dans ton système: email = username)
     * - On récupère ensuite le Driver correspondant à cet email
     *
     * @param auth objet Spring Security (utilisateur connecté)
     * @return DriverDTO du conducteur connecté
     */
    /**
     * DRIVER connecté : voir son propre profil
     */
    public DriverDTO getMyProfile(Authentication auth) {
        String email = auth.getName();

        Driver driver = driverRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found for email: " + email));

        return new DriverDTO(driver);
    }

    private User getAuthenticatedUser(Authentication auth) {
        String email = auth.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    /**
     * OWNER connecté courant
     */
    private User getAuthenticatedOwner(Authentication auth) {
        String email = auth.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        if (!user.hasRole(Role.ERole.ROLE_OWNER)) {
            throw new AccessDeniedException("Access denied: OWNER only");
        }

        return user;
    }


    /**
     * OWNER : lister seulement ses drivers
     */
    public List<DriverDTO> getMyDrivers(Authentication auth) {
        User owner = getAuthenticatedOwner(auth);

        return driverRepository.findAllByOwner(owner)
                .stream()
                .map(DriverDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * OWNER : voir les détails d’un de ses drivers
     */
    public DriverDTO getMyDriverById(Long id, Authentication auth) {
        User owner = getAuthenticatedOwner(auth);

        Driver driver = driverRepository.findByIdAndOwner(id, owner)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Driver not found with id: " + id + " for this owner"
                ));

        return new DriverDTO(driver);
    }




    /**
     * OWNER : modifier seulement un driver qui lui appartient
     */
    public DriverDTO updateMyDriver(Long id, DriverDTO dto, Authentication auth) {
        User owner = getAuthenticatedOwner(auth);

        Driver existingDriver = driverRepository.findByIdAndOwner(id, owner)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Driver not found with id: " + id + " for this owner"
                ));

        String newFirstName = dto.getFirstName() == null ? existingDriver.getFirstName() : dto.getFirstName().trim();
        String newLastName = dto.getLastName() == null ? existingDriver.getLastName() : dto.getLastName().trim();
        String newEmail = dto.getEmail() == null ? existingDriver.getEmail() : dto.getEmail().trim().toLowerCase();
        String newPhone = dto.getPhone() == null ? existingDriver.getPhone() : dto.getPhone().trim();
        String newLicense = dto.getLicenseNumber() == null ? existingDriver.getLicenseNumber() : dto.getLicenseNumber().trim();

        if (!existingDriver.getEmail().equalsIgnoreCase(newEmail)) {
            if (userRepository.existsByEmail(newEmail) || driverRepository.existsByEmail(newEmail)) {
                throw new IllegalArgumentException("Email already exists");
            }
        }

        if (newPhone != null && !newPhone.isBlank()) {
            User userWithPhone = userRepository.findByEmail(existingDriver.getEmail()).orElse(null);
            String oldPhone = userWithPhone != null ? userWithPhone.getPhone() : existingDriver.getPhone();

            if (oldPhone == null || !oldPhone.equals(newPhone)) {
                if (Boolean.TRUE.equals(userRepository.existsByPhone(newPhone))) {
                    throw new IllegalArgumentException("Phone already exists");
                }
            }
        }

        if (!existingDriver.getLicenseNumber().equals(newLicense)
                && driverRepository.existsByLicenseNumber(newLicense)) {
            throw new IllegalArgumentException("License number already exists");
        }

        existingDriver.setFirstName(newFirstName);
        existingDriver.setLastName(newLastName);
        existingDriver.setEmail(newEmail);
        existingDriver.setPhone(newPhone);
        existingDriver.setLicenseNumber(newLicense);
        existingDriver.setLicenseExpiry(dto.getLicenseExpiry());
        existingDriver.setEcoScore(dto.getEcoScore());
        existingDriver.setStatus(dto.getStatus());
        existingDriver.setUpdatedAt(LocalDateTime.now());

        Driver updatedDriver = driverRepository.save(existingDriver);

        User user = userRepository.findByEmail(existingDriver.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User account not found for driver email: " + existingDriver.getEmail()
                ));

        user.setFirstName(newFirstName);
        user.setLastName(newLastName);
        user.setEmail(newEmail);
        user.setPhone(newPhone);

        userRepository.save(user);

        return new DriverDTO(updatedDriver);
    }


    /**
     * OWNER : supprimer un driver qui lui appartient
     * Supprime aussi le compte User lié pour éviter un compte orphelin.
     */
    public void deleteMyDriver(Long id, Authentication auth) {
        User owner = getAuthenticatedOwner(auth);

        Driver driver = driverRepository.findByIdAndOwner(id, owner)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Driver not found with id: " + id + " for this owner"
                ));

        String driverEmail = driver.getEmail();

        driverRepository.delete(driver);

        userRepository.findByEmail(driverEmail).ifPresent(userRepository::delete);
    }


    public DriverDTO createDriverByOwner(CreateDriverByOwnerRequest request, Authentication auth) {
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            throw new IllegalArgumentException("Unauthorized");
        }

        User owner = userRepository.findByEmailIgnoreCase(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Owner not found"));

        if (!"ROLE_OWNER".equals(owner.getRoleName()) && !"ROLE_ADMIN".equals(owner.getRoleName())) {
            throw new IllegalArgumentException("Access denied");
        }

        String email = normalizeEmail(request.getEmail());
        String licenseNumber = normalizeText(request.getLicenseNumber());

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Email already used");
        }

        if (driverRepository.existsByLicenseNumber(licenseNumber)) {
            throw new IllegalArgumentException("License number already used");
        }

        Role driverRole = roleRepository.findByName("ROLE_DRIVER")
                .orElseThrow(() -> new IllegalStateException("ROLE_DRIVER not found"));

        String tempPassword = passwordGeneratorService.generateTemporaryPassword(12);

        User driverUser = new User();
        driverUser.setFirstName(normalizeText(request.getFirstName()));
        driverUser.setLastName(normalizeText(request.getLastName()));
        driverUser.setEmail(email);
        driverUser.setPhone(normalizeText(request.getPhone()));
        driverUser.setPassword(passwordEncoder.encode(tempPassword));
        driverUser.setRole(driverRole);
        driverUser.setEnabled(true);
        driverUser.setMustChangePassword(true);

        userRepository.save(driverUser);

        Driver driver = new Driver();
        driver.setFirstName(driverUser.getFirstName());
        driver.setLastName(driverUser.getLastName());
        driver.setEmail(driverUser.getEmail());
        driver.setPhone(driverUser.getPhone());
        driver.setLicenseNumber(licenseNumber);
        driver.setLicenseExpiry(request.getLicenseExpiry());

        // ✅ ligne manquante
        driver.setOwner(owner);

        Driver savedDriver = driverRepository.save(driver);

        emailService.sendDriverCredentialsEmail(
                savedDriver.getEmail(),
                savedDriver.getFirstName(),
                savedDriver.getEmail(),
                tempPassword
        );

        return new DriverDTO(savedDriver);
    }
    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        return email.trim().toLowerCase();
    }

    private String normalizeText(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Required field is missing");
        }
        return value.trim();
    }

    /**
     * ADMIN : nombre de drivers d’un owner
     */
    public long countDriversByOwner(Long ownerId) {
        return driverRepository.countByOwnerId(ownerId);
    }
}