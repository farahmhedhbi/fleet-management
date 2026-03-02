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
        if (auth == null || auth.getName() == null) {
            throw new SubscriptionExpiredException("Not authenticated");
        }

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new SubscriptionExpiredException("User not found"));

        // On applique la règle seulement aux OWNER
        if (!"ROLE_OWNER".equals(user.getRoleName())) return;

        LocalDateTime now = LocalDateTime.now();

        boolean inTrial = user.getSubscriptionStatus() == User.SubscriptionStatus.TRIAL
                && user.getTrialEndAt() != null
                && user.getTrialEndAt().isAfter(now);

        boolean isPaidActive = user.getSubscriptionStatus() == User.SubscriptionStatus.ACTIVE
                && user.getPaidUntil() != null
                && user.getPaidUntil().isAfter(now);

        if (!(inTrial || isPaidActive)) {
            throw new SubscriptionExpiredException("SUBSCRIPTION_EXPIRED");
        }
    }
}