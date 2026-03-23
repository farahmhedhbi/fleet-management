package com.example.fleet_backend.exception;

import com.example.fleet_backend.security.SubscriptionExpiredException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> notFound(ResourceNotFoundException e) {
        return ResponseEntity
                .status(404)
                .body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> forbidden() {
        return ResponseEntity
                .status(403)
                .body(Map.of("error", "Forbidden"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> badRequest(IllegalArgumentException e) {
        return ResponseEntity
                .status(400)
                .body(Map.of("error", e.getMessage()));
    }

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
        e.printStackTrace();
        return ResponseEntity
                .status(500)
                .body(Map.of(
                        "error", "Internal server error",
                        "message", e.getMessage()
                ));
    }
}