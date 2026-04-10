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

    public NotificationDTO(Notification n) {
        this.id = n.getId();
        this.title = n.getTitle();
        this.message = n.getMessage();
        this.read = n.isRead();
        this.createdAt = n.getCreatedAt();
        this.missionId = n.getMissionId();
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public boolean isRead() {
        return read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Long getMissionId() {
        return missionId;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setMissionId(Long missionId) {
        this.missionId = missionId;
    }
}