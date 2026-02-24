package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ✅ VehicleRepository
 *
 * Interface d'accès aux données pour l'entité Vehicle.
 *
 * Hérite de JpaRepository<Vehicle, Long> :
 * - Vehicle = entité
 * - Long = type de la clé primaire (id)
 *
 * Grâce à JpaRepository, tu obtiens automatiquement :
 * - save()
 * - findById()
 * - findAll()
 * - deleteById()
 * - count()
 * - etc.
 *
 * Spring Data JPA génère automatiquement les requêtes SQL
 * à partir des noms de méthodes (query derivation).
 */
@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    /**
     * ✅ Trouver un véhicule par son numéro d'immatriculation.
     * Retourne Optional pour éviter NullPointerException.
     */
    Optional<Vehicle> findByRegistrationNumber(String registrationNumber);

    /**
     * ✅ Trouver un véhicule par son VIN (Vehicle Identification Number).
     * Le VIN est normalement unique.
     */
    Optional<Vehicle> findByVin(String vin);

    /**
     * ✅ Liste des véhicules assignés à un conducteur spécifique.
     *
     * Utilisé par:
     * - VehicleService pour ROLE_DRIVER
     */
    List<Vehicle> findByDriverId(Long driverId);

    /**
     * ✅ Trouver des véhicules selon leur statut.
     * Exemple: AVAILABLE, IN_SERVICE, MAINTENANCE...
     */
    List<Vehicle> findByStatus(Vehicle.VehicleStatus status);

    /**
     * ✅ Trouver des véhicules selon la marque.
     * Exemple: "Toyota", "BMW"
     */
    List<Vehicle> findByBrand(String brand);

    /**
     * ✅ Trouver tous les véhicules appartenant à un owner.
     *
     * Très utilisé dans:
     * - ROLE_OWNER
     * - sécurisation des accès
     */
    List<Vehicle> findByOwnerId(Long ownerId);

    /**
     * ✅ Trouver un véhicule spécifique appartenant à un owner.
     *
     * Permet de sécuriser un accès:
     * - vérifier que le véhicule appartient bien à l'owner connecté
     */
    Optional<Vehicle> findByIdAndOwnerId(Long id, Long ownerId);

    /**
     * ✅ Vérifie si un numéro d'immatriculation existe déjà.
     *
     * Utilisé avant création ou modification pour garantir unicité.
     */
    boolean existsByRegistrationNumber(String registrationNumber);

    /**
     * ✅ Vérifie si un VIN existe déjà.
     */
    boolean existsByVin(String vin);

    /**
     * ✅ Supprimer tous les véhicules d’un owner donné.
     *
     * Utilisé dans:
     * - AdminUserService.delete()
     *
     * ⚠️ Supprime en masse.
     * Doit être utilisé avec précaution.
     */
    void deleteByOwnerId(Long ownerId);
}