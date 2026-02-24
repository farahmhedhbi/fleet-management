package com.example.fleet_backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * ✅ Exception métier : ResourceNotFoundException
 *
 * Cette exception est utilisée lorsque :
 * - Une entité n’existe pas en base
 * - Une ressource demandée par ID/email/etc. est introuvable
 *
 * Grâce à @ResponseStatus(HttpStatus.NOT_FOUND),
 * Spring renvoie automatiquement :
 *
 * HTTP 404 NOT FOUND
 *
 * Sans avoir besoin d’un try/catch dans les contrôleurs.
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {

    /**
     * Constructeur simple avec message
     */
    public ResourceNotFoundException(String message) {
        super(message);
    }

    /**
     * Constructeur avec message + cause (exception interne)
     */
    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}