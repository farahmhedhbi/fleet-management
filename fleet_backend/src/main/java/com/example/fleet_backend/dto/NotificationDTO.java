package com.example.fleet_backend.dto;

import com.example.fleet_backend.model.Notification;
import java.time.LocalDateTime;

public class NotificationDTO {
    private Long id;
    private String title;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
    private Long missionId;

    public NotificationDTO() {}

    public NotificationDTO(Notification n) {
        this.id = n.getId();
        this.title = n.getTitle();
        this.message = n.getMessage();
        this.read = n.isRead();
        this.createdAt = n.getCreatedAt();
        this.missionId = n.getMissionId();
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public boolean isRead() { return read; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Long getMissionId() { return missionId; }
}