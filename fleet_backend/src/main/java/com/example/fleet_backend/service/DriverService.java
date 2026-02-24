package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.DriverDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Driver;
import com.example.fleet_backend.repository.DriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    /**
     * ✅ DriverRepository:
     * - Accès base de données (table drivers)
     * - Fournit findByEmail, existsByEmail, existsByLicenseNumber, etc.
     *
     * ⚠️ @Autowired fonctionne, mais injection par constructeur est recommandée.
     */
    @Autowired
    private DriverRepository driverRepository;

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
    public DriverDTO getMyProfile(Authentication auth) {

        // Email du user connecté
        String email = auth.getName();

        // Charger le driver profile lié à cet email
        Driver driver = driverRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found for email: " + email));

        // Retourner un DTO (ne pas exposer l'entité directement)
        return new DriverDTO(driver);
    }

    /**
     * ✅ Retourne la liste de tous les conducteurs
     * Utilisé surtout par ADMIN/OWNER (selon tes règles de sécurité côté Controller).
     *
     * @return liste de DriverDTO
     */
    public List<DriverDTO> getAllDrivers() {
        return driverRepository.findAll()
                .stream()
                .map(DriverDTO::new) // Entity -> DTO
                .collect(Collectors.toList());
    }

    /**
     * ✅ Retourne un conducteur par ID
     *
     * @param id identifiant conducteur
     * @return DriverDTO
     */
    public DriverDTO getDriverById(Long id) {

        // 404 si introuvable
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + id));

        return new DriverDTO(driver);
    }

    /**
     * ✅ Créer un nouveau conducteur
     *
     * Règles métier importantes:
     * - email unique
     * - licenseNumber unique
     *
     * @param driverDTO données conducteur envoyées par le frontend
     * @return DriverDTO du conducteur créé
     */
    public DriverDTO createDriver(DriverDTO driverDTO) {

        // ✅ Vérification unicité email
        if (driverRepository.existsByEmail(driverDTO.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        // ✅ Vérification unicité numéro permis
        if (driverRepository.existsByLicenseNumber(driverDTO.getLicenseNumber())) {
            throw new IllegalArgumentException("License number already exists");
        }

        // Création entité Driver à partir du DTO
        Driver driver = new Driver();
        driver.setFirstName(driverDTO.getFirstName());
        driver.setLastName(driverDTO.getLastName());
        driver.setEmail(driverDTO.getEmail());
        driver.setPhone(driverDTO.getPhone());
        driver.setLicenseNumber(driverDTO.getLicenseNumber());
        driver.setLicenseExpiry(driverDTO.getLicenseExpiry());
        driver.setEcoScore(driverDTO.getEcoScore());
        driver.setStatus(driverDTO.getStatus());

        // Sauvegarde en base
        Driver savedDriver = driverRepository.save(driver);

        // Retourner un DTO
        return new DriverDTO(savedDriver);
    }

    /**
     * ✅ Mettre à jour un conducteur existant
     *
     * Règle importante:
     * - Si l'email change, vérifier unicité (sinon conflit)
     *
     * @param id identifiant conducteur
     * @param driverDTO nouvelles données
     * @return DriverDTO mis à jour
     */
    public DriverDTO updateDriver(Long id, DriverDTO driverDTO) {

        // Charger le driver existant sinon 404
        Driver existingDriver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + id));

        // ✅ Si l'email est modifié, vérifier qu'il n'existe pas déjà ailleurs
        if (!existingDriver.getEmail().equals(driverDTO.getEmail()) &&
                driverRepository.existsByEmail(driverDTO.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Mise à jour des champs
        existingDriver.setFirstName(driverDTO.getFirstName());
        existingDriver.setLastName(driverDTO.getLastName());
        existingDriver.setEmail(driverDTO.getEmail());
        existingDriver.setPhone(driverDTO.getPhone());
        existingDriver.setLicenseNumber(driverDTO.getLicenseNumber());
        existingDriver.setLicenseExpiry(driverDTO.getLicenseExpiry());
        existingDriver.setEcoScore(driverDTO.getEcoScore());
        existingDriver.setStatus(driverDTO.getStatus());

        // Sauvegarde
        Driver updatedDriver = driverRepository.save(existingDriver);

        return new DriverDTO(updatedDriver);
    }

    /**
     * ✅ Supprimer un conducteur
     *
     * Étapes:
     * - vérifier existence (sinon 404)
     * - supprimer par id
     *
     * @param id identifiant conducteur
     */
    public void deleteDriver(Long id) {

        // Vérifier existence
        if (!driverRepository.existsById(id)) {
            throw new ResourceNotFoundException("Driver not found with id: " + id);
        }

        // Supprimer en base
        driverRepository.deleteById(id);
    }
}