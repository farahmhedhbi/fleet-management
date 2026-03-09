package com.example.fleet_backend.config;

import com.example.fleet_backend.model.Role;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.RoleRepository;
import com.example.fleet_backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminBootstrapConfig {

    @Bean
    CommandLineRunner bootstrapSingleAdmin(UserRepository userRepository,
                                           RoleRepository roleRepository,
                                           PasswordEncoder passwordEncoder) {
        return args -> {
            long adminCount = userRepository.countByRole_Name("ROLE_ADMIN");

            if (adminCount > 1) {
                throw new IllegalStateException("Erreur critique: plusieurs comptes ADMIN existent.");
            }

            if (adminCount == 0) {
                Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                        .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN not found"));

                User admin = new User();
                admin.setFirstName("Super");
                admin.setLastName("Admin");
                admin.setEmail("admin@fleet.com");
                admin.setPassword(passwordEncoder.encode("Admin@12345"));
                admin.setRole(adminRole);
                admin.setEnabled(true);
                admin.setMustChangePassword(false);

                userRepository.save(admin);
            }
        };
    }
}