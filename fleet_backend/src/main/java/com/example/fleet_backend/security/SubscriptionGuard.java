package com.example.fleet_backend.security;

import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class SubscriptionGuard {

    private final UserRepository userRepository;

    public SubscriptionGuard(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void requireOwnerActive(Authentication auth) {
        if (auth == null || auth.getName() == null) return;

        User u = userRepository.findByEmailIgnoreCase(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!"ROLE_OWNER".equals(u.getRoleName())) return;
        if (u.getSubscriptionStatus() == User.SubscriptionStatus.ACTIVE) {
            if (u.getPaidUntil() != null && u.getPaidUntil().isAfter(LocalDateTime.now())) return;
            throw new SubscriptionExpiredException();
        }
        if (u.getSubscriptionStatus() == User.SubscriptionStatus.TRIAL) {
            if (u.getTrialEndAt() != null && u.getTrialEndAt().isAfter(LocalDateTime.now())) return;
            throw new SubscriptionExpiredException();
        }
        throw new SubscriptionExpiredException();
    }
}