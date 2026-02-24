package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.VehicleDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.repository.DriverRepository;
import com.example.fleet_backend.repository.UserRepository;
import com.example.fleet_backend.repository.VehicleRepository;
import com.example.fleet_backend.security.AuthUtil;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.stream.Collectors;

/**
 * ✅ VehicleService: couche métier (Business Layer) pour gérer les véhicules.
 *
 * Rôle principal:
 * - Centraliser la logique métier (CRUD + assignation conducteur)
 * - Appliquer la sécurité (contrôle d'accès) selon le rôle connecté
 * - Transformer Entity -> DTO pour envoyer une réponse propre au Frontend
 *
 * @Service :
 * - Indique à Spring que cette classe est un composant métier injectable.
 *
 * @Transactional (au niveau de la classe) :
 * - Toutes les méthodes sont exécutées dans une transaction DB.
 * - Si une exception survient, Spring fait rollback automatiquement.
 */
@Service
@Transactional
public class VehicleService {

    /**
     * ✅ Repositories = accès DB (couche persistence)
     * - VehicleRepository : opérations sur table vehicles
     * - DriverRepository  : opérations sur table drivers (profil conducteur)
     * - UserRepository    : opérations sur table users (auth)
     */
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final UserRepository userRepository;

    /**
     * ✅ Injection via constructeur (meilleure pratique que @Autowired)
     */
    public VehicleService(VehicleRepository vehicleRepository,
                          DriverRepository driverRepository,
                          UserRepository userRepository) {
        this.vehicleRepository = vehicleRepository;
        this.driverRepository = driverRepository;
        this.userRepository = userRepository;
    }

    // ✅ Liste filtrée selon le rôle (1 seul GET /api/vehicles)
    /**
     * Retourne la liste des véhicules visibles par l'utilisateur connecté:
     * - ADMIN  : voit tous les véhicules
     * - OWNER  : voit uniquement ses véhicules (ownerId = id user connecté)
     * - DRIVER : voit uniquement les véhicules affectés à son profil Driver
     *
     * Avantage: un seul endpoint côté Controller / Frontend.
     */
    public List<VehicleDTO> getVehiclesForConnectedUser(Authentication auth) {

        // ✅ ADMIN: accès global
        if (AuthUtil.isAdmin(auth)) {
            return vehicleRepository.findAll()
                    .stream()
                    .map(VehicleDTO::new) // Entity -> DTO
                    .collect(Collectors.toList());
        }

        // ✅ OWNER: seulement les véhicules dont owner_id = user connecté
        if (AuthUtil.hasRole(auth, "OWNER")) {
            Long ownerId = AuthUtil.userId(auth);
            return vehicleRepository.findByOwnerId(ownerId)
                    .stream()
                    .map(VehicleDTO::new)
                    .collect(Collectors.toList());
        }

        // ✅ DRIVER: seulement les véhicules affectés à son Driver profile
        if (AuthUtil.hasRole(auth, "DRIVER")) {

            // auth.getName() = username/email du user connecté (selon ton SecurityConfig)
            String email = auth.getName();

            // On récupère le Driver profile à partir de l'email
            Driver driver = driverRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Driver not found for email: " + email));

            // Puis on récupère les véhicules affectés à ce driver
            return vehicleRepository.findByDriverId(driver.getId())
                    .stream()
                    .map(VehicleDTO::new)
                    .collect(Collectors.toList());
        }

        // 🚫 Si le rôle ne correspond pas (ou pas autorisé)
        throw new AccessDeniedException("Forbidden");
    }

    // ✅ GET /api/vehicles/{id} sécurisé
    /**
     * Récupérer un véhicule par ID avec contrôle d’accès:
     * - ADMIN  : autorisé
     * - OWNER  : autorisé seulement si c'est SON véhicule
     * - DRIVER : autorisé seulement si le véhicule lui est affecté
     */
    public VehicleDTO getVehicleByIdSecured(Long id, Authentication auth) {

        // ✅ 404 si véhicule introuvable
        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));

        // ✅ ADMIN: accès direct
        if (AuthUtil.isAdmin(auth)) return new VehicleDTO(v);

        // ✅ OWNER: vérifie la propriété
        if (AuthUtil.hasRole(auth, "OWNER")) {
            Long ownerId = AuthUtil.userId(auth);

            // Protection: owner null ou différent => 403
            if (v.getOwner() == null || !v.getOwner().getId().equals(ownerId)) {
                throw new AccessDeniedException("Not your vehicle");
            }
            return new VehicleDTO(v);
        }

        // ✅ DRIVER: vérifie l'affectation
        if (AuthUtil.hasRole(auth, "DRIVER")) {
            String email = auth.getName();
            Driver driver = driverRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Driver not found for email: " + email));

            // Protection: driver null ou différent => 403
            if (v.getDriver() == null || !v.getDriver().getId().equals(driver.getId())) {
                throw new AccessDeniedException("Vehicle not assigned to you");
            }
            return new VehicleDTO(v);
        }

        throw new AccessDeniedException("Forbidden");
    }

    // ✅ POST sécurisé
    /**
     * Créer un véhicule (sécurisé):
     * - Autorisé: OWNER ou ADMIN
     * - Applique règles d'unicité (matricule, VIN)
     * - Définit owner = user connecté
     * - Peut affecter un driver directement si dto.driverId existe
     */
    public VehicleDTO createVehicleSecured(VehicleDTO dto, Authentication auth) {

        // OWNER/ADMIN seulement (même si Controller a @PreAuthorize)
        if (!(AuthUtil.isAdmin(auth) || AuthUtil.hasRole(auth, "OWNER"))) {
            throw new AccessDeniedException("Forbidden");
        }

        // ✅ Matricule unique
        if (vehicleRepository.existsByRegistrationNumber(dto.getRegistrationNumber())) {
            throw new IllegalArgumentException("Registration number already exists");
        }

        // ✅ VIN unique (si fourni)
        if (dto.getVin() != null && vehicleRepository.existsByVin(dto.getVin())) {
            throw new IllegalArgumentException("VIN already exists");
        }

        // ✅ Création entity + mapping depuis DTO
        Vehicle v = new Vehicle();
        mapDtoToEntity(dto, v);

        // ✅ owner = user connecté
        Long ownerId = AuthUtil.userId(auth);
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Owner user not found: " + ownerId));
        v.setOwner(owner);

        // ✅ Affectation initiale d'un conducteur si driverId est fourni
        if (dto.getDriverId() != null) {
            Driver d = driverRepository.findById(dto.getDriverId())
                    .orElseThrow(() -> new ResourceNotFoundException("Driver not found: " + dto.getDriverId()));
            v.setDriver(d);
        }

        // ✅ Save + return DTO
        return new VehicleDTO(vehicleRepository.save(v));
    }

    // ✅ PUT sécurisé
    /**
     * Mettre à jour un véhicule:
     * - ADMIN: peut modifier tout
     * - OWNER: peut modifier seulement ses véhicules
     * - Vérifie unicité matricule si changement
     * - driverId null => désaffectation du conducteur
     */
    public VehicleDTO updateVehicleSecured(Long id, VehicleDTO dto, Authentication auth) {

        // ✅ 404 si introuvable
        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));

        // ✅ OWNER contrôle propriété (admin bypass)
        if (!AuthUtil.isAdmin(auth)) {
            Long ownerId = AuthUtil.userId(auth);
            if (v.getOwner() == null || !v.getOwner().getId().equals(ownerId)) {
                throw new AccessDeniedException("Not your vehicle");
            }
        }

        // ✅ Vérifier unicité du matricule si changé
        if (dto.getRegistrationNumber() != null &&
                !dto.getRegistrationNumber().equals(v.getRegistrationNumber()) &&
                vehicleRepository.existsByRegistrationNumber(dto.getRegistrationNumber())) {
            throw new IllegalArgumentException("Registration number already exists");
        }

        // ✅ Mise à jour des champs
        mapDtoToEntity(dto, v);

        // ✅ Affectation / désaffectation driver
        if (dto.getDriverId() != null) {
            Driver d = driverRepository.findById(dto.getDriverId())
                    .orElseThrow(() -> new ResourceNotFoundException("Driver not found: " + dto.getDriverId()));
            v.setDriver(d);
        } else {
            // driverId absent => retirer le conducteur
            v.setDriver(null);
        }

        return new VehicleDTO(vehicleRepository.save(v));
    }

    // ✅ DELETE sécurisé
    /**
     * Supprimer un véhicule:
     * - ADMIN: ok
     * - OWNER: seulement ses véhicules
     */
    public void deleteVehicleSecured(Long id, Authentication auth) {
        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));

        if (!AuthUtil.isAdmin(auth)) {
            Long ownerId = AuthUtil.userId(auth);
            if (v.getOwner() == null || !v.getOwner().getId().equals(ownerId)) {
                throw new AccessDeniedException("Not your vehicle");
            }
        }

        vehicleRepository.delete(v);
    }

    // ✅ assign driver sécurisé
    /**
     * Affecter un conducteur à un véhicule:
     * - ADMIN: ok
     * - OWNER: seulement ses véhicules
     */
    public VehicleDTO assignDriverToVehicleSecured(Long vehicleId, Long driverId, Authentication auth) {
        Vehicle v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + vehicleId));

        if (!AuthUtil.isAdmin(auth)) {
            Long ownerId = AuthUtil.userId(auth);
            if (v.getOwner() == null || !v.getOwner().getId().equals(ownerId)) {
                throw new AccessDeniedException("Not your vehicle");
            }
        }

        Driver d = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found: " + driverId));

        v.setDriver(d);
        return new VehicleDTO(vehicleRepository.save(v));
    }

    /**
     * Désaffecter un conducteur (via méthode sécurisée):
     * - ADMIN: ok
     * - OWNER: seulement ses véhicules
     */
    public VehicleDTO removeDriverFromVehicleSecured(Long vehicleId, Authentication auth) {
        Vehicle v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + vehicleId));

        if (!AuthUtil.isAdmin(auth)) {
            Long ownerId = AuthUtil.userId(auth);
            if (v.getOwner() == null || !v.getOwner().getId().equals(ownerId)) {
                throw new AccessDeniedException("Not your vehicle");
            }
        }

        v.setDriver(null);
        return new VehicleDTO(vehicleRepository.save(v));
    }

    /**
     * ✅ Méthode utilitaire: DTO -> Entity
     * Centralise le mapping pour éviter la répétition dans create/update.
     */
    private void mapDtoToEntity(VehicleDTO dto, Vehicle v) {
        v.setRegistrationNumber(dto.getRegistrationNumber());
        v.setBrand(dto.getBrand());
        v.setModel(dto.getModel());
        v.setYear(dto.getYear());
        v.setColor(dto.getColor());
        v.setVin(dto.getVin());
        v.setFuelType(dto.getFuelType());
        v.setTransmission(dto.getTransmission());
        v.setStatus(dto.getStatus());
        v.setMileage(dto.getMileage());
        v.setLastMaintenanceDate(dto.getLastMaintenanceDate());
        v.setNextMaintenanceDate(dto.getNextMaintenanceDate());
    }

    /**
     * ✅ Désaffecter conducteur (version simple)
     *
     * ⚠️ Remarque:
     * - Cette méthode n'applique PAS de contrôle d'accès (pas de Authentication)
     * - Elle doit être appelée uniquement depuis un Controller déjà sécurisé
     *   (ex: @PreAuthorize("hasRole('ADMIN') or hasRole('OWNER')")
     *   + vérification owner côté Controller ou via une autre méthode)
     *
     * @Transactional ici est redondant car la classe est déjà @Transactional,
     * mais ce n'est pas une erreur.
     */
    @Transactional
    public Vehicle unassignDriver(Long vehicleId) {

        // ✅ 404 si introuvable
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        // ✅ تفريغ: retirer le conducteur
        vehicle.setDriver(null);

        // ✅ Save
        return vehicleRepository.save(vehicle);
    }
}