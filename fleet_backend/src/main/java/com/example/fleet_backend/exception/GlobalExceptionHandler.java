package com.example.fleet_backend.exception;

import com.example.fleet_backend.security.SubscriptionExpiredException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> notFound(ResourceNotFoundException e) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of(
                        "success", false,
                        "error", "NOT_FOUND",
                        "message", e.getMessage(),
                        "timestamp", LocalDateTime.now()
                ));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> forbidden() {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(Map.of(
                        "success", false,
                        "error", "FORBIDDEN",
                        "message", "Accès refusé",
                        "timestamp", LocalDateTime.now()
                ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> badRequest(IllegalArgumentException e) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "success", false,
                        "error", "BAD_REQUEST",
                        "message", e.getMessage(),
                        "timestamp", LocalDateTime.now()
                ));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<?> businessError(IllegalStateException e) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "success", false,
                        "error", "BUSINESS_RULE_ERROR",
                        "message", e.getMessage(),
                        "timestamp", LocalDateTime.now()
                ));
    }

    @ExceptionHandler(SubscriptionExpiredException.class)
    public ResponseEntity<?> handleSubscriptionExpired(SubscriptionExpiredException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "success", false,
                "error", "SUBSCRIPTION_EXPIRED",
                "message", "Votre période d’essai est terminée. Veuillez effectuer le paiement pour activer.",
                "timestamp", LocalDateTime.now()
        ));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> runtimeError(RuntimeException e) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "success", false,
                        "error", "BUSINESS_ERROR",
                        "message", e.getMessage(),
                        "timestamp", LocalDateTime.now()
                ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> serverError(Exception e) {
        e.printStackTrace();

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                        "success", false,
                        "error", "INTERNAL_SERVER_ERROR",
                        "message", "Une erreur technique est survenue.",
                        "timestamp", LocalDateTime.now()
                ));
    }
}