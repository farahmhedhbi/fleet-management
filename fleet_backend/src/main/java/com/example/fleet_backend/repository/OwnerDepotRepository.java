package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.OwnerDepot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OwnerDepotRepository extends JpaRepository<OwnerDepot, Long> {

    Optional<OwnerDepot> findByOwnerId(Long ownerId);
}