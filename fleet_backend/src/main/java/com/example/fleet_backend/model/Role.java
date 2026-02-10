package com.example.fleet_backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "roles")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", length = 20, unique = true, nullable = false)
    private String name;

    public Role() {}

    public Role(String name) {
        this.name = name;
    }

    public Role(ERole name) {
        this.name = name.name();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setName(ERole name) {
        this.name = name.name();
    }

    public enum ERole {
        ROLE_DRIVER,
        ROLE_OWNER,
        ROLE_ADMIN,
        ROLE_API_CLIENT,
    }
}