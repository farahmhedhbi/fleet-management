package com.example.fleet_backend.repository;

import com.example.fleet_backend.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name);

    // Méthode pour chercher par ERole
    default Optional<Role> findByName(Role.ERole name) {
        return findByName(name.name());
    }

    // Méthode pour vérifier l'existence par ERole
    default boolean existsByName(Role.ERole name) {
        return findByName(name.name()).isPresent();
    }
}