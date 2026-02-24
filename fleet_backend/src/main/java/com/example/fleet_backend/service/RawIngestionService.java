package com.example.fleet_backend.service;

import com.example.fleet_backend.model.RawData;
import com.example.fleet_backend.repository.RawDataRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * ✅ RawIngestionService
 *
 * Rôle:
 * - Service dédié à l'ingestion (stockage brut) des données entrantes
 * - Sauvegarde des données API ou CSV AVANT tout traitement métier
 *
 * 🎯 Pourquoi c'est important ?
 * - Permet audit / traçabilité
 * - Permet debug si erreur traitement
 * - Permet retraitement ultérieur des données
 *
 * Architecture typique:
 * Source externe → RawIngestionService → Table raw_data → Traitement → Tables métier
 */
@Service
public class RawIngestionService {

    /**
     * ✅ RawDataRepository:
     * - Permet sauvegarde dans la table raw_data
     */
    private final RawDataRepository rawRepo;

    /**
     * ✅ ObjectMapper (Jackson):
     * - Convertit objets Java en JSON (JsonNode)
     * - Standard dans Spring Boot pour manipulation JSON
     */
    private final ObjectMapper mapper;

    /**
     * ✅ Injection par constructeur (bonne pratique)
     */
    public RawIngestionService(RawDataRepository rawRepo, ObjectMapper mapper) {
        this.rawRepo = rawRepo;
        this.mapper = mapper;
    }

    /**
     * ✅ Sauvegarder un payload provenant d'une API externe
     *
     * Exemple:
     * - Données GPS
     * - Données OBD
     * - Webhook externe
     *
     * Étapes:
     * 1) Convertir l'objet Java en JSON (JsonNode)
     * 2) Sauvegarder en base avec source="API"
     *
     * @param payload objet reçu (DTO ou Map ou autre)
     * @return RawData sauvegardé
     */
    @Transactional
    public RawData saveApiPayload(Object payload) {

        // Conversion générique objet -> JSON
        JsonNode node = mapper.valueToTree(payload);

        // source="API", fileName=null, rowNumber=null
        return rawRepo.save(new RawData("API", node, null, null));
    }

    /**
     * ✅ Sauvegarder une ligne provenant d'un fichier CSV
     *
     * Exemple:
     * - Import kilométrage
     * - Import maintenance
     * - Import données véhicules
     *
     * On stocke:
     * - source="CSV"
     * - contenu JSON de la ligne
     * - nom du fichier
     * - numéro de ligne (utile pour debug)
     *
     * @param row JsonNode représentant la ligne CSV
     * @param fileName nom du fichier importé
     * @param rowNumber numéro de ligne dans le fichier
     * @return RawData sauvegardé
     */
    @Transactional
    public RawData saveCsvRow(JsonNode row, String fileName, int rowNumber) {

        return rawRepo.save(new RawData("CSV", row, fileName, rowNumber));
    }
}