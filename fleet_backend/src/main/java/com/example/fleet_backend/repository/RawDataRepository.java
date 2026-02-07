package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.RawData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RawDataRepository extends JpaRepository<RawData, Long> {
}
