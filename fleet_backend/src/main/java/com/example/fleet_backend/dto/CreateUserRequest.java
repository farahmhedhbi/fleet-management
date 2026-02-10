package com.example.fleet_backend.dto;

public class CreateUserRequest {
    public String firstName;
    public String lastName;
    public String email;
    public String password;
    public String role; // "ROLE_OWNER" | "ROLE_DRIVER" | ...
}

