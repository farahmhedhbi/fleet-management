package com.example.fleet_backend.dto;

import java.time.LocalDateTime;

public class UserAdminDTO {
    public Long id;
    public String firstName;
    public String lastName;
    public String email;
    public String role;      // "ROLE_ADMIN"...
    public boolean enabled;
    public LocalDateTime lastLoginAt;
}

