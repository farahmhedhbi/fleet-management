package com.example.fleet_backend.dto;

import java.time.Instant;

public class UserSubscriptionResponse {
    public Long id;
    public String firstName;
    public String lastName;
    public String email;
    public String role;

    public String subscriptionStatus;
    public Instant trialStartAt;
    public Instant trialEndAt;
    public Instant paidUntil;
}