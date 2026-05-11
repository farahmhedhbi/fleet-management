package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.IncidentPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncidentPhotoRepository extends JpaRepository<IncidentPhoto, Long> {

    List<IncidentPhoto> findByIncidentIdOrderByCreatedAtAsc(Long incidentId);

    void deleteByIncidentId(Long incidentId);
}