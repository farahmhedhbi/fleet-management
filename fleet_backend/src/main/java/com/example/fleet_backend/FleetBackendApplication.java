package com.example.fleet_backend;


import com.example.fleet_backend.model.Role;
import com.example.fleet_backend.model.Role.ERole;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.RoleRepository;
import com.example.fleet_backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.List;

@SpringBootApplication
public class FleetBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(FleetBackendApplication.class, args);
	}

	@Bean
	public CommandLineRunner initData(RoleRepository roleRepository,
									  UserRepository userRepository,
									  PasswordEncoder passwordEncoder) {
		return args -> {
			System.out.println("=== Initialisation des données ===");

			// 1. Initialiser les rôles
			List<ERole> roles = List.of(
					ERole.ROLE_ADMIN,
					ERole.ROLE_OWNER,
					ERole.ROLE_DRIVER,
					ERole.ROLE_API_CLIENT // ✅ ajouté
			);

			for (ERole roleName : roles) {
				if (roleRepository.findByName(roleName).isEmpty()) {
					try {
						Role role = new Role(roleName);
						roleRepository.save(role);
						System.out.println("Role créé: " + roleName);
					} catch (Exception e) {
						System.out.println("Erreur création role " + roleName + ": " + e.getMessage());
					}
				} else {
					System.out.println("Role existe déjà: " + roleName);
				}
			}

			// 2. Créer un utilisateur admin par défaut si non existant
			if (userRepository.findByEmail("admin@fleet.com").isEmpty()) {
				Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
						.orElseThrow(() -> new RuntimeException("Admin role not found"));

				User admin = new User(
						"Admin",
						"User",
						"admin@fleet.com",
						passwordEncoder.encode("admin123"),
						adminRole
				);

				userRepository.save(admin);
				System.out.println("Admin user créé: admin@fleet.com / admin123");
			}

			// 3. Créer un utilisateur driver par défaut
			if (userRepository.findByEmail("driver@fleet.com").isEmpty()) {
				Role driverRole = roleRepository.findByName(ERole.ROLE_DRIVER)
						.orElseThrow(() -> new RuntimeException("Driver role not found"));

				User driver = new User(
						"John",
						"Driver",
						"driver@fleet.com",
						passwordEncoder.encode("driver123"),
						driverRole
				);

				userRepository.save(driver);
				System.out.println("Driver user créé: driver@fleet.com / driver123");
			}

			// 4. Créer un utilisateur owner par défaut
			if (userRepository.findByEmail("owner@fleet.com").isEmpty()) {
				Role ownerRole = roleRepository.findByName(ERole.ROLE_OWNER)
						.orElseThrow(() -> new RuntimeException("Owner role not found"));

				User owner = new User(
						"Jane",
						"Owner",
						"owner@fleet.com",
						passwordEncoder.encode("owner123"),
						ownerRole
				);

				userRepository.save(owner);
				System.out.println("Owner user créé: owner@fleet.com / owner123");
			}

			System.out.println("=== Initialisation terminée ===");
		};
	}
}