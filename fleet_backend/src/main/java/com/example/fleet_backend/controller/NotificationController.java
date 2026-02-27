package com.example.fleet_backend.controller;

import com.example.fleet_backend.dto.NotificationDTO;
import com.example.fleet_backend.service.NotificationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*", maxAge = 3600)
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    // ✅ OWNER ONLY
    @GetMapping
    @PreAuthorize("hasRole('OWNER')")
    public List<NotificationDTO> my(Authentication auth) {
        return notificationService.myNotifications(auth);
    }

    // ✅ OWNER ONLY
    @GetMapping("/unread-count")
    @PreAuthorize("hasRole('OWNER')")
    public long unreadCount(Authentication auth) {
        return notificationService.myUnreadCount(auth);
    }

    // ✅ OWNER ONLY
    @PutMapping("/{id}/read")
    @PreAuthorize("hasRole('OWNER')")
    public void markRead(@PathVariable Long id, Authentication auth) {
        notificationService.markRead(id, auth);
    }

    // ✅ OWNER ONLY
    @PutMapping("/read-all")
    @PreAuthorize("hasRole('OWNER')")
    public void markAllRead(Authentication auth) {
        notificationService.markAllRead(auth);
    }
}