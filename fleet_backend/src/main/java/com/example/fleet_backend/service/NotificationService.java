package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.NotificationDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Notification;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.NotificationRepository;
import com.example.fleet_backend.repository.UserRepository;
import com.example.fleet_backend.security.AuthUtil;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationService {

    public static final String DRIVER_LATE_ALERT_TITLE = "Retard de mission";

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public void createForUser(Long userId, String title, String message, Long missionId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Notification notification = new Notification();
        notification.setRecipient(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setMissionId(missionId);
        notification.setRead(false);

        notificationRepository.save(notification);
    }

    public List<NotificationDTO> myNotifications(Authentication auth) {
        Long userId = AuthUtil.userId(auth);
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationDTO::new)
                .collect(Collectors.toList());
    }

    public long myUnreadCount(Authentication auth) {
        Long userId = AuthUtil.userId(auth);
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    public void markRead(Long notificationId, Authentication auth) {
        Long userId = AuthUtil.userId(auth);

        Notification notification = notificationRepository.findByIdAndRecipientId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    public void markAllRead(Authentication auth) {
        Long userId = AuthUtil.userId(auth);

        List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
        for (Notification notification : notifications) {
            if (!notification.isRead()) {
                notification.setRead(true);
            }
        }

        notificationRepository.saveAll(notifications);
    }


    public void clearNotificationByTitle(Long recipientId, Long missionId, String title) {
        notificationRepository.deleteByRecipientIdAndMissionIdAndTitle(recipientId, missionId, title);
    }
}