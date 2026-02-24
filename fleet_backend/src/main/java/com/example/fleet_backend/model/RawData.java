package com.example.fleet_backend.model;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

/**
 * ✅ Entité RawData
 *
 * Cette entité sert à stocker les données brutes importées
 * depuis différentes sources (CSV ou API).
 *
 * Objectif :
 * - Traçabilité des imports
 * - Stockage des données non transformées
 * - Audit / debugging
 * - Préparation pour traitement futur (ETL / analytics / IA)
 *
 * Table : raw_data
 */
@Entity
@Table(name = "raw_data")
public class RawData {

    /**
     * ✅ Clé primaire auto-générée
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ✅ Source de la donnée
     * Valeurs attendues :
     * - "CSV"
     * - "API"
     *
     * Longueur max 10 caractères
     */
    @Column(name="source", nullable=false, length=10)
    private String source;

    /**
     * ✅ Contenu brut en JSONB (PostgreSQL)
     *
     * - Stocké en type jsonb
     * - Permet requêtes JSON avancées en base
     * - Utilise JsonNode (Jackson)
     *
     * Exemple contenu :
     * {
     *   "vehicle_id": 1,
     *   "driver_id": 2,
     *   "distance": 120,
     *   "duration": 90,
     *   "date": "2026-02-01"
     * }
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name="raw_content", nullable=false, columnDefinition="jsonb")
    private JsonNode rawContent;

    /**
     * ✅ Nom du fichier CSV (si source = CSV)
     */
    @Column(name="file_name")
    private String fileName;

    /**
     * ✅ Numéro de ligne du CSV (si source = CSV)
     */
    @Column(name="row_number")
    private Integer rowNumber;

    /**
     * ✅ Timestamp automatique d'import
     *
     * OffsetDateTime permet de gérer fuseau horaire.
     */
    @CreationTimestamp
    @Column(name="imported_at", nullable=false)
    private OffsetDateTime importedAt;

    /**
     * Constructeur vide requis par JPA
     */
    public RawData() {}

    /**
     * Constructeur pratique pour insertion
     */
    public RawData(String source, JsonNode rawContent, String fileName, Integer rowNumber) {
        this.source = source;
        this.rawContent = rawContent;
        this.fileName = fileName;
        this.rowNumber = rowNumber;
    }

    // =========================
    // GETTERS (lecture seule)
    // =========================

    public Long getId() { return id; }
    public String getSource() { return source; }
    public JsonNode getRawContent() { return rawContent; }
    public String getFileName() { return fileName; }
    public Integer getRowNumber() { return rowNumber; }
    public OffsetDateTime getImportedAt() { return importedAt; }
}