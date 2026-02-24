package com.example.fleet_backend.controller;

import com.example.fleet_backend.service.CsvImportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * ✅ CsvImportController
 *
 * Contrôleur REST permettant d'importer un fichier CSV
 * contenant des données (ex: trajets).
 *
 * Base URL : /import
 *
 * Les données ne sont PAS transformées directement :
 * elles sont stockées dans la table raw_data (JSONB)
 * via RawIngestionService.
 */
@RestController
@RequestMapping("/import")
public class CsvImportController {

    private final CsvImportService csvImportService;

    // Injection par constructeur (bonne pratique Spring)
    public CsvImportController(CsvImportService csvImportService) {
        this.csvImportService = csvImportService;
    }

    /**
     * ✅ Import CSV (ADMIN uniquement)
     *
     * POST /import/csv
     *
     * - Reçoit un fichier multipart
     * - Vérifie les colonnes obligatoires
     * - Valide les données ligne par ligne
     * - Stocke en base dans la table raw_data
     *
     * Sécurité :
     * @PreAuthorize("hasRole('ADMIN')")
     * → Seul un ADMIN peut injecter des données brutes.
     *
     * Retour :
     * - message de confirmation
     * - nombre de lignes importées
     */
    @PostMapping("/csv")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> importCsv(@RequestParam("file") MultipartFile file) {

        // Le service gère :
        // - Vérification fichier vide
        // - Vérification headers obligatoires
        // - Validation des champs numériques et date
        int stored = csvImportService.importCsv(file);

        return ResponseEntity.ok(
                Map.of(
                        "message", "CSV imported in RAW",
                        "rows", stored
                )
        );
    }
}