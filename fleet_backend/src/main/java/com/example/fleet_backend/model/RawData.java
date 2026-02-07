package com.example.fleet_backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

import com.fasterxml.jackson.databind.JsonNode;

@Entity
@Table(name = "raw_data")
public class RawData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ex: "CSV" ou "API"
    @Column(name = "source_type", nullable = false)
    private String sourceType;

    // jsonb
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_content", columnDefinition = "jsonb", nullable = false)
    private JsonNode rawContent;

    @Column(name = "imported_at", nullable = false)
    private LocalDateTime importedAt;

    @PrePersist
    public void prePersist() {
        if (importedAt == null) importedAt = LocalDateTime.now();
    }

    public RawData() {}

    public RawData(String sourceType, JsonNode rawContent) {
        this.sourceType = sourceType;
        this.rawContent = rawContent;
        this.importedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public JsonNode getRawContent() { return rawContent; }
    public void setRawContent(JsonNode rawContent) { this.rawContent = rawContent; }
    public LocalDateTime getImportedAt() { return importedAt; }
    public void setImportedAt(LocalDateTime importedAt) { this.importedAt = importedAt; }
}
