package com.example.fleet_backend.model;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name = "raw_data")
public class RawData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="source", nullable=false, length=10)
    private String source; // CSV / API

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name="raw_content", nullable=false, columnDefinition="jsonb")
    private JsonNode rawContent;

    @Column(name="file_name")
    private String fileName;

    @Column(name="row_number")
    private Integer rowNumber;

    @CreationTimestamp
    @Column(name="imported_at", nullable=false)
    private OffsetDateTime importedAt;

    public RawData() {}

    public RawData(String source, JsonNode rawContent, String fileName, Integer rowNumber) {
        this.source = source;
        this.rawContent = rawContent;
        this.fileName = fileName;
        this.rowNumber = rowNumber;
    }

    public Long getId() { return id; }
    public String getSource() { return source; }
    public JsonNode getRawContent() { return rawContent; }
    public String getFileName() { return fileName; }
    public Integer getRowNumber() { return rowNumber; }
    public OffsetDateTime getImportedAt() { return importedAt; }
}
