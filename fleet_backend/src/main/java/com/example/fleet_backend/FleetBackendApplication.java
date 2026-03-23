package com.example.fleet_backend;

import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.Role;
import com.example.fleet_backend.model.Role.ERole;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.DriverRepository;
import com.example.fleet_backend.repository.RoleRepository;
import com.example.fleet_backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@SpringBootApplication
@EnableScheduling
public class FleetBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(FleetBackendApplication.class, args);
	}

	@Bean
	public static CommandLineRunner initData(
			RoleRepository roleRepository,
			UserRepository userRepository,
			DriverRepository driverRepository,
			PasswordEncoder passwordEncoder
	) {
		return args -> {
			System.out.println("=== Initialisation des données ===");

			List<ERole> roles = List.of(
					ERole.ROLE_ADMIN,
					ERole.ROLE_OWNER,
					ERole.ROLE_DRIVER,
					ERole.ROLE_API_CLIENT
			);

			for (ERole roleName : roles) {
				if (roleRepository.findByName(roleName).isEmpty()) {
					roleRepository.save(new Role(roleName));
					System.out.println("Role créé: " + roleName);
				} else {
					System.out.println("Role existe déjà: " + roleName);
				}
			}

			long adminCount = userRepository.countByRole_Name("ROLE_ADMIN");

			if (adminCount == 0) {
				Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
						.orElseThrow(() -> new RuntimeException("Admin role not found"));

				User admin = new User(
						"Admin",
						"User",
						"admin@fleet.com",
						passwordEncoder.encode("admin123"),
						adminRole
				);
				admin.setEnabled(true);

				userRepository.save(admin);
				System.out.println("Admin user créé: admin@fleet.com / admin123");
			} else if (adminCount == 1) {
				System.out.println("Admin unique déjà existant (ok).");
			} else {
				System.out.println("ATTENTION: Plusieurs admins détectés (" + adminCount + ").");
			}

			if (userRepository.findByEmail("driver@fleet.com").isEmpty()) {
				Role driverRole = roleRepository.findByName(ERole.ROLE_DRIVER)
						.orElseThrow(() -> new RuntimeException("Driver role not found"));

				User driverUser = new User(
						"John",
						"Driver",
						"driver@fleet.com",
						passwordEncoder.encode("driver123"),
						driverRole
				);
				driverUser.setEnabled(true);
				userRepository.save(driverUser);
				System.out.println("Driver user créé: driver@fleet.com / driver123");
			}

			if (!driverRepository.existsByEmail("driver@fleet.com")) {
				String defaultLicense = "TN-DR-0001";

				if (driverRepository.existsByLicenseNumber(defaultLicense)) {
					defaultLicense = "TN-DR-" + System.currentTimeMillis();
				}

				Driver d = new Driver();
				d.setFirstName("John");
				d.setLastName("Driver");
				d.setEmail("driver@fleet.com");
				d.setLicenseNumber(defaultLicense);

				driverRepository.save(d);
				System.out.println("Driver profile créé: driver@fleet.com / license=" + defaultLicense);
			}

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
				owner.setEnabled(true);
				userRepository.save(owner);
				System.out.println("Owner user créé: owner@fleet.com / owner123");
			}

			System.out.println("=== Initialisation terminée ===");
		};
	}
}