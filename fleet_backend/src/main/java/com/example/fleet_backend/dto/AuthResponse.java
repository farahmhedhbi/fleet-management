package com.example.fleet_backend.dto;

import java.time.Instant;

public class AuthResponse {
    public String token;
    public String type;
    public Long id;
    public String email;
    public String firstName;
    public String lastName;
    public String role;

    public String subscriptionStatus;
    public Instant trialStartAt;
    public Instant trialEndAt;
    public Instant paidUntil;

    public boolean mustChangePassword;

    public AuthResponse(String token, String type, Long id, String email,
                        String firstName, String lastName, String role,
                        String subscriptionStatus, Instant trialStartAt, Instant trialEndAt, Instant paidUntil , boolean mustChangePassword) {
        this.token = token;
        this.type = type;
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
        this.subscriptionStatus = subscriptionStatus;
        this.trialStartAt = trialStartAt;
        this.trialEndAt = trialEndAt;
        this.paidUntil = paidUntil;
        this.mustChangePassword = mustChangePassword;
    }

    // =========================
    // GETTERS & SETTERS
    // =========================
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getSubscriptionStatus() {
        return subscriptionStatus;
    }

    public void setSubscriptionStatus(String subscriptionStatus) {
        this.subscriptionStatus = subscriptionStatus;
    }

    public Instant getTrialStartAt() {
        return trialStartAt;
    }

    public void setTrialStartAt(Instant trialStartAt) {
        this.trialStartAt = trialStartAt;
    }

    public Instant getTrialEndAt() {
        return trialEndAt;
    }

    public void setTrialEndAt(Instant trialEndAt) {
        this.trialEndAt = trialEndAt;
    }

    public Instant getPaidUntil() {
        return paidUntil;
    }

    public void setPaidUntil(Instant paidUntil) {
        this.paidUntil = paidUntil;
    }
    public boolean isMustChangePassword() {
        return mustChangePassword;
    }

    public void setMustChangePassword(boolean mustChangePassword) {
        this.mustChangePassword = mustChangePassword;
    }
}