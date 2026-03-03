package com.example.fleet_backend.exception;

import com.example.fleet_backend.security.SubscriptionExpiredException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * ✅ GlobalExceptionHandler
 *
 * Intercepte toutes les exceptions levées dans l'application
 * et retourne des réponses HTTP propres et structurées.
 *
 * @RestControllerAdvice :
 * - S'applique à tous les @RestController
 * - Centralise la gestion d'erreurs
 *
 * Avantages :
 * - API propre
 * - Réponses cohérentes
 * - Pas de try/catch dans chaque controller
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * ✅ 404 - Ressource introuvable
     *
     * Déclenchée quand ResourceNotFoundException est levée.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> notFound(ResourceNotFoundException e) {
        return ResponseEntity
                .status(404)
                .body(Map.of("error", e.getMessage()));
    }

    /**
     * ✅ 403 - Accès refusé
     *
     * Déclenchée quand :
     * - AuthUtil bloque
     * - Spring Security refuse l'accès
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> forbidden() {
        return ResponseEntity
                .status(403)
                .body(Map.of("error", "Forbidden"));
    }

    /**
     * ✅ 400 - Mauvaise requête
     *
     * Déclenchée pour :
     * - Données invalides
     * - Conflits métier
     * - Paramètres incorrects
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> badRequest(IllegalArgumentException e) {
        return ResponseEntity
                .status(400)
                .body(Map.of("error", e.getMessage()));
    }

    /**
     * ✅ 500 - Erreur serveur interne
     *
     * Catch global pour toute exception non prévue.
     *
     * ⚠️ En production on éviterait d’exposer les détails internes.
     */

    @ExceptionHandler(SubscriptionExpiredException.class)
    public ResponseEntity<?> handleSubscriptionExpired(SubscriptionExpiredException ex) {
        // 403 ou 402 (Payment Required). Beaucoup utilisent 403.
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "error", "SUBSCRIPTION_EXPIRED",
                "message", "Votre période d’essai est terminée. Veuillez effectuer le paiement pour activer."
        ));
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> serverError(Exception e) {
        e.printStackTrace(); // ✅ dev only
        return ResponseEntity
                .status(500)
                .body(Map.of(
                        "error", "Internal server error",
                        "message", e.getMessage()
                ));
    }
}