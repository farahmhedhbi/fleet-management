package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.IncidentHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncidentHistoryRepository extends JpaRepository<IncidentHistory, Long> {

    List<IncidentHistory> findByIncidentIdOrderByCreatedAtAsc(Long incidentId);
    List<IncidentHistory> findTop100ByOrderByCreatedAtDesc();
}