package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.RawData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * ✅ RawDataRepository
 *
 * Repository JPA pour l'entité RawData.
 *
 * Rôle de RawData dans ton projet :
 * - Stocker les données brutes (raw) provenant :
 *   • API externe
 *   • Fichiers CSV
 *   • Sources IoT / télématique
 *
 * Cette table sert généralement comme :
 * - zone d’ingestion
 * - stockage temporaire
 * - audit / traçabilité des données entrantes
 *
 * Hérite de JpaRepository<RawData, Long> :
 * - RawData = entité
 * - Long = type de la clé primaire
 *
 * Méthodes automatiques disponibles :
 * - save()
 * - findById()
 * - findAll()
 * - deleteById()
 * - count()
 * - etc.
 *
 * 👉 Aucune méthode personnalisée ici,
 * mais Spring Data JPA fournit déjà tout le CRUD de base.
 *
 * Utilisé dans :
 * - RawIngestionService
 * - CsvImportService
 */
@Repository
public interface RawDataRepository extends JpaRepository<RawData, Long> {
}