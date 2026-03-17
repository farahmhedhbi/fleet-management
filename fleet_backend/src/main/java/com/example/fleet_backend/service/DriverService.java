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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

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
        this.passwordGeneratorService = passwordGeneratorService;
        this.smsService = smsService;
    }

    public DriverDTO getMyProfile(Authentication auth) {
        String email = auth.getName();

        Driver driver = driverRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found for email: " + email));

        return new DriverDTO(driver);
    }

    private User getAuthenticatedOwner(Authentication auth) {
        String email = auth.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        if (!user.hasRole(Role.ERole.ROLE_OWNER)) {
            throw new AccessDeniedException("Access denied: OWNER only");
        }

        return user;
    }

    public List<DriverDTO> getMyDrivers(Authentication auth) {
        User owner = getAuthenticatedOwner(auth);

        return driverRepository.findAllByOwner(owner)
                .stream()
                .map(DriverDTO::new)
                .collect(Collectors.toList());
    }

    public DriverDTO getMyDriverById(Long id, Authentication auth) {
        User owner = getAuthenticatedOwner(auth);

        Driver driver = driverRepository.findByIdAndOwner(id, owner)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Driver not found with id: " + id + " for this owner"
                ));

        return new DriverDTO(driver);
    }

    public DriverDTO updateMyDriver(Long id, DriverDTO dto, Authentication auth) {
        User owner = getAuthenticatedOwner(auth);

        Driver existingDriver = driverRepository.findByIdAndOwner(id, owner)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Driver not found with id: " + id + " for this owner"
                ));

        String oldEmail = existingDriver.getEmail();

        String newFirstName = dto.getFirstName() == null
                ? existingDriver.getFirstName()
                : dto.getFirstName().trim();

        String newLastName = dto.getLastName() == null
                ? existingDriver.getLastName()
                : dto.getLastName().trim();

        String newEmail = dto.getEmail() == null
                ? existingDriver.getEmail()
                : dto.getEmail().trim().toLowerCase();

        String newPhone = dto.getPhone() == null
                ? existingDriver.getPhone()
                : dto.getPhone().trim();

        String newLicense = dto.getLicenseNumber() == null
                ? existingDriver.getLicenseNumber()
                : dto.getLicenseNumber().trim();

        if (!existingDriver.getEmail().equalsIgnoreCase(newEmail)) {
            if (userRepository.existsByEmailIgnoreCase(newEmail) || driverRepository.existsByEmail(newEmail)) {
                throw new IllegalArgumentException("Email already exists");
            }
        }

        if (newPhone != null && !newPhone.isBlank()) {
            User linkedUser = userRepository.findByEmailIgnoreCase(oldEmail).orElse(null);
            String oldPhone = linkedUser != null ? linkedUser.getPhone() : existingDriver.getPhone();

            if (oldPhone == null || !oldPhone.equals(newPhone)) {
                if (userRepository.existsByPhone(newPhone)) {
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

        User linkedUser = userRepository.findByEmailIgnoreCase(oldEmail)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User account not found for driver email: " + oldEmail
                ));

        linkedUser.setFirstName(newFirstName);
        linkedUser.setLastName(newLastName);
        linkedUser.setEmail(newEmail);
        linkedUser.setPhone(newPhone);

        userRepository.save(linkedUser);

        return new DriverDTO(updatedDriver);
    }

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

        String firstName = normalizeRequiredText(request.getFirstName(), "First name is required");
        String lastName = normalizeRequiredText(request.getLastName(), "Last name is required");
        String email = normalizeEmail(request.getEmail());
        String phone = normalizeOptionalText(request.getPhone());
        String licenseNumber = normalizeRequiredText(request.getLicenseNumber(), "License number is required");

        if (userRepository.existsByEmailIgnoreCase(email) || driverRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        if (phone != null && userRepository.existsByPhone(phone)) {
            throw new IllegalArgumentException("Phone already exists");
        }

        if (driverRepository.existsByLicenseNumber(licenseNumber)) {
            throw new IllegalArgumentException("License number already exists");
        }

        Role driverRole = roleRepository.findByName("ROLE_DRIVER")
                .orElseThrow(() -> new IllegalStateException("ROLE_DRIVER not found"));

        String tempPassword = passwordGeneratorService.generateTemporaryPassword(12);

        User driverUser = new User();
        driverUser.setFirstName(firstName);
        driverUser.setLastName(lastName);
        driverUser.setEmail(email);
        driverUser.setPhone(phone);
        driverUser.setPassword(passwordEncoder.encode(tempPassword));
        driverUser.setRole(driverRole);
        driverUser.setEnabled(true);
        driverUser.setMustChangePassword(true);

        userRepository.save(driverUser);

        Driver driver = new Driver();
        driver.setFirstName(firstName);
        driver.setLastName(lastName);
        driver.setEmail(email);
        driver.setPhone(phone);
        driver.setLicenseNumber(licenseNumber);
        driver.setLicenseExpiry(request.getLicenseExpiry());
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

    private String normalizeRequiredText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    public long countDriversByOwner(Long ownerId) {
        return driverRepository.countByOwnerId(ownerId);
    }
}