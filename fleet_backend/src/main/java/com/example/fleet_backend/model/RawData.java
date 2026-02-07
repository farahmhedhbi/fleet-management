package com.example.fleet_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "raw_data")
public class RawData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="source_type", nullable = false)
    private String sourceType;

    @Column(name="raw_content", nullable = false, columnDefinition = "text")
    private String rawContent;

    @Column(name="imported_at", nullable = false)
    private LocalDateTime importedAt = LocalDateTime.now();

    public RawData() {}

    public RawData(String sourceType, String rawContent) {
        this.sourceType = sourceType;
        this.rawContent = rawContent;
        this.importedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getSourceType() { return sourceType; }
    public String getRawContent() { return rawContent; }
    public LocalDateTime getImportedAt() { return importedAt; }

    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public void setRawContent(String rawContent) { this.rawContent = rawContent; }
    public void setImportedAt(LocalDateTime importedAt) { this.importedAt = importedAt; }
}
