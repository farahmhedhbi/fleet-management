package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ✅ DriverRepository
 *
 * Repository JPA pour l'entité Driver.
 *
 * Driver représente le profil métier du conducteur
 * (différent de l'entité User qui gère l’authentification).
 *
 * Hérite de JpaRepository<Driver, Long> :
 * - Driver = entité
 * - Long = type de la clé primaire (id)
 *
 * Méthodes standards disponibles automatiquement :
 * - save()
 * - findById()
 * - findAll()
 * - deleteById()
 * - count()
 * - etc.
 *
 * Utilisé principalement dans :
 * - DriverService
 * - VehicleService (assignation)
 * - AuthService (création profil driver)
 * - AdminService (création / MAJ profil driver)
 * - AdminUserService (suppression profil driver)
 */
@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {

    /**
     * ✅ Trouver un Driver par email.
     *
     * Important car :
     * - Dans ton système, email = identifiant principal
     * - Permet de relier User (authentification) au Driver (profil métier)
     */
    Optional<Driver> findByEmail(String email);

    /**
     * ✅ Trouver un Driver par numéro de permis (licenseNumber).
     *
     * Le licenseNumber doit être unique.
     * Utilisé pour vérifier doublons.
     */
    Optional<Driver> findByLicenseNumber(String licenseNumber);

    /**
     * ✅ Trouver les drivers selon leur statut.
     *
     * Exemple :
     * - ACTIVE
     * - INACTIVE
     * - SUSPENDED
     */
    List<Driver> findByStatus(Driver.DriverStatus status);

    /**
     * ✅ Vérifie si un email existe déjà dans la table drivers.
     *
     * Utilisé avant création pour éviter doublons.
     */
    boolean existsByEmail(String email);

    /**
     * ✅ Vérifie si un licenseNumber existe déjà.
     *
     * Garantit l’unicité du numéro de permis.
     */
    boolean existsByLicenseNumber(String licenseNumber);

    /**
     * ✅ Supprimer un profil Driver via email.
     *
     * Utilisé dans :
     * - AdminUserService.delete()
     *
     * ⚠️ Supprime le profil métier, mais pas forcément l’utilisateur (User).
     * La suppression du User se fait via UserRepository.
     */
    void deleteByEmail(String email);
}