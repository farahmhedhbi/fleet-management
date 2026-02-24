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
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

/**
 *  Classe principale Spring Boot.
 * - Lance l'application
 * - Contient un "seeding" (initData) pour créer roles + users par défaut au démarrage
 */
@SpringBootApplication
public class FleetBackendApplication {

	public static void main(String[] args) {
		//  Démarre Spring Boot (scan composants, config, serveur embedded, etc.)
		SpringApplication.run(FleetBackendApplication.class, args);
	}

	/**
	 * CommandLineRunner s'exécute automatiquement juste après le démarrage de Spring.
	 * Utile pour:
	 * - insérer des données initiales (roles, admin, users de test)
	 * - éviter d'avoir une base vide au premier lancement
	 *
	 *  Bonnes pratiques:
	 * - Toujours vérifier si la donnée existe déjà avant de créer (sinon duplication)
	 * - En prod, on évite souvent ce seed (ou on le contrôle par profile)
	 */
	@Bean
	public CommandLineRunner initData(RoleRepository roleRepository,
									  UserRepository userRepository,
									  DriverRepository driverRepository,   // AJOUT: repo driver pour créer "driver profile"
									  PasswordEncoder passwordEncoder) {
		return args -> {
			System.out.println("=== Initialisation des données ===");

			// =========================================================
			// 1) Création des rôles (ROLE_ADMIN, ROLE_OWNER, ROLE_DRIVER, ...)
			// =========================================================
			//  On prépare la liste des rôles attendus par l'application.
			// Cela évite les erreurs "role not found" au moment d'inscrire / authentifier un user.
			List<ERole> roles = List.of(
					ERole.ROLE_ADMIN,
					ERole.ROLE_OWNER,
					ERole.ROLE_DRIVER,
					ERole.ROLE_API_CLIENT
			);

			// Insert "idempotent": si le rôle existe déjà, on ne le recrée pas.
			for (ERole roleName : roles) {
				if (roleRepository.findByName(roleName).isEmpty()) {
					roleRepository.save(new Role(roleName));
					System.out.println("Role créé: " + roleName);
				} else {
					System.out.println("Role existe déjà: " + roleName);
				}
			}

			// =========================================================
			// 2) Création user ADMIN par défaut
			// =========================================================
			//  Objectif: avoir un compte admin prêt pour gérer l'application dès le 1er lancement.
			if (userRepository.findByEmail("admin@fleet.com").isEmpty()) {

				//  On récupère le rôle ADMIN depuis la DB (sinon exception)
				Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
						.orElseThrow(() -> new RuntimeException("Admin role not found"));

				//  PasswordEncoder = hash du mot de passe (sécurité)
				//  Ne jamais enregistrer un mot de passe en clair.
				User admin = new User("Admin", "User", "admin@fleet.com",
						passwordEncoder.encode("admin123"),
						adminRole
				);

				//  enabled=true: compte activé (utile si tu as activation email)
				admin.setEnabled(true);

				userRepository.save(admin);
				System.out.println("Admin user créé: admin@fleet.com / admin123");
			}

			// =========================================================
			// 3) Création user DRIVER + profil Driver (table drivers)
			// =========================================================
			// Chez toi: Driver = 2 parties:
			// - User (authentification / sécurité)
			// - Driver (profil métier: licenseNumber, etc.)
			if (userRepository.findByEmail("driver@fleet.com").isEmpty()) {

				Role driverRole = roleRepository.findByName(ERole.ROLE_DRIVER)
						.orElseThrow(() -> new RuntimeException("Driver role not found"));

				User driverUser = new User("John", "Driver", "driver@fleet.com",
						passwordEncoder.encode("driver123"),
						driverRole
				);
				driverUser.setEnabled(true);
				userRepository.save(driverUser);
				System.out.println("Driver user créé: driver@fleet.com / driver123");
			}

			//  IMPORTANT:
			// Même si le user existe déjà, on vérifie séparément le "Driver profile".
			// Car User et Driver sont 2 tables différentes.
			if (!driverRepository.existsByEmail("driver@fleet.com")) {

				// ️ licenseNumber doit être UNIQUE (si tu as une contrainte unique en DB)
				String defaultLicense = "TN-DR-0001";

				//  Si déjà pris, on génère une valeur unique (fallback)
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

			// =========================================================
			// 4) Création user OWNER par défaut
			// =========================================================
			//  Objectif: avoir un owner prêt pour tester la gestion des véhicules / maintenance.
			if (userRepository.findByEmail("owner@fleet.com").isEmpty()) {

				Role ownerRole = roleRepository.findByName(ERole.ROLE_OWNER)
						.orElseThrow(() -> new RuntimeException("Owner role not found"));

				User owner = new User("Jane", "Owner", "owner@fleet.com",
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