package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.VehicleDTO;
import com.example.fleet_backend.model.Vehicle;
import com.example.fleet_backend.security.SubscriptionGuard;
import com.example.fleet_backend.service.VehicleService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ✅ VehicleController
 *
 * Contrôleur REST pour la gestion des véhicules.
 * Toutes les routes sont protégées par Spring Security (JWT + rôles).
 *
 * Base URL : /api/vehicles
 */
@RestController
@RequestMapping("/api/vehicles")
@CrossOrigin(origins = "*", maxAge = 3600) // Autorise le frontend (CORS)
public class VehicleController {

    private final VehicleService vehicleService;
    private final SubscriptionGuard subscriptionGuard;

    // Injection par constructeur (bonne pratique)
    public VehicleController(VehicleService vehicleService , SubscriptionGuard subscriptionGuard) {
        this.vehicleService = vehicleService;
        this.subscriptionGuard = subscriptionGuard;
    }

    /**
     * ✅ LISTE des véhicules accessibles à l'utilisateur connecté
     *
     * - DRIVER : voit ses véhicules
     * - OWNER  : voit ses véhicules
     * - ADMIN  : voit tout
     *
     * Le filtrage réel est effectué dans le service.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('DRIVER','OWNER','ADMIN')")
    public List<VehicleDTO> list(Authentication auth) {
        subscriptionGuard.requireOwnerActive(auth);
        return vehicleService.getVehiclesForConnectedUser(auth);
    }

    /**
     * ✅ Récupérer un véhicule par ID
     *
     * Le service vérifie si l'utilisateur a le droit d'y accéder.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DRIVER','OWNER','ADMIN')")
    public VehicleDTO getById(@PathVariable Long id, Authentication auth) {
        subscriptionGuard.requireOwnerActive(auth);
        return vehicleService.getVehicleByIdSecured(id, auth);
    }

    /**
     * ✅ Créer un véhicule
     *
     * Autorisé uniquement pour OWNER et ADMIN.
     * L'owner sera automatiquement lié via Authentication.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public VehicleDTO create(@RequestBody VehicleDTO dto, Authentication auth) {

        // Logs utiles pour debug JWT (à retirer en production)
        System.out.println("AUTH user=" + auth.getName());
        System.out.println("AUTH roles=" + auth.getAuthorities());
        subscriptionGuard.requireOwnerActive(auth);

        return vehicleService.createVehicleSecured(dto, auth);
    }

    /**
     * ✅ Modifier un véhicule
     *
     * OWNER peut modifier uniquement ses véhicules.
     * ADMIN peut modifier tous les véhicules.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public VehicleDTO update(@PathVariable Long id,
                             @RequestBody VehicleDTO dto,
                             Authentication auth) {

        // Debug sécurité
        System.out.println("UPDATE AUTH user=" + auth.getName());
        System.out.println("UPDATE AUTH roles=" + auth.getAuthorities());
        System.out.println("UPDATE AUTH id=" +
                com.example.fleet_backend.security.AuthUtil.userId(auth));
        subscriptionGuard.requireOwnerActive(auth);

        return vehicleService.updateVehicleSecured(id, dto, auth);
    }

    /**
     * ✅ Supprimer un véhicule
     *
     * - OWNER : peut supprimer ses véhicules
     * - ADMIN : peut supprimer tous
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        subscriptionGuard.requireOwnerActive(auth);
        vehicleService.deleteVehicleSecured(id, auth);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/unassign-driver")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public ResponseEntity<Vehicle> unassignDriver(@PathVariable Long id, Authentication auth) {
        subscriptionGuard.requireOwnerActive(auth);
        Vehicle updated = vehicleService.unassignDriver(id);
        return ResponseEntity.ok(updated);
    }

    /**
     * ✅ Retirer le conducteur d’un véhicule (version sécurisée)
     *
     * OWNER ou ADMIN uniquement.
     */
    @PostMapping("/{id}/remove-driver")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN')")
    public VehicleDTO removeDriver(@PathVariable Long id, Authentication auth) {
        subscriptionGuard.requireOwnerActive(auth);
        return vehicleService.removeDriverFromVehicleSecured(id, auth);
    }

    /**
     * ⚠ Version non sécurisée (pas de @PreAuthorize ici)
     * À sécuriser si utilisé en production.
     *
     * Retire le conducteur d’un véhicule.
     */

}