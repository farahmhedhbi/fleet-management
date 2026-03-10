package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.TripIngestRequest;
import com.example.fleet_backend.service.RawIngestionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * ✅ ApiIngestionController
 *
 * Contrôleur REST permettant de recevoir des données
 * provenant d'une source externe (ex: API GPS / IoT / OBD).
 *
 * Base URL : /api
 *
 * Les données reçues sont stockées en RAW (JSONB)
 * sans transformation immédiate.
 * Elles pourront être traitées plus tard (pipeline).
 */
@RestController
@RequestMapping("/api")
public class ApiIngestionController {

    private final RawIngestionService rawIngestionService;

    // Injection par constructeur (bonne pratique Spring)
    public ApiIngestionController(RawIngestionService rawIngestionService) {
        this.rawIngestionService = rawIngestionService;
    }

    /**
     * ✅ Endpoint d’ingestion API
     *
     * POST /api/data
     *
     * Sécurité :
     * - Accessible uniquement aux rôles :
     *   ROLE_API_CLIENT
     *   ROLE_ADMIN
     *
     * Fonctionnement :
     * - Reçoit un TripIngestRequest validé (@Valid)
     * - Stocke directement les données en base (table raw_data)
     * - Ne fait PAS de traitement métier ici
     *
     * Architecture pipeline-ready :
     * Ingestion → RAW → Transformation ultérieure
     */
    @PostMapping("/data")
    @PreAuthorize("hasAnyRole('OWNER')")
    public ResponseEntity<?> receive(
            @Valid @RequestBody TripIngestRequest req) {

        // Sauvegarde brute en JSONB via RawIngestionService
        rawIngestionService.saveApiPayload(req);

        return ResponseEntity.ok(
                Map.of("message", "OK - stored in RAW")
        );
    }
}