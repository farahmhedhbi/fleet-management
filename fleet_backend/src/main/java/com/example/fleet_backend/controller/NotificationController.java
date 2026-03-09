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

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','DRIVER')")
    public List<NotificationDTO> my(Authentication auth) {
        return notificationService.myNotifications(auth);
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasAnyRole('OWNER','DRIVER')")
    public long unreadCount(Authentication auth) {
        return notificationService.myUnreadCount(auth);
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('OWNER','DRIVER')")
    public void markRead(@PathVariable Long id, Authentication auth) {
        notificationService.markRead(id, auth);
    }

    @PutMapping("/read-all")
    @PreAuthorize("hasAnyRole('OWNER','DRIVER')")
    public void markAllRead(Authentication auth) {
        notificationService.markAllRead(auth);
    }
}