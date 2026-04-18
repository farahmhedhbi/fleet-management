package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.TelemetryData;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TelemetryDataRepository extends JpaRepository<TelemetryData, Long> {
}