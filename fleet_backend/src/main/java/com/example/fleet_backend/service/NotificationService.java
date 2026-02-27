package com.example.fleet_backend.service;

import com.example.fleet_backend.dto.NotificationDTO;
import com.example.fleet_backend.exception.ResourceNotFoundException;
import com.example.fleet_backend.model.Notification;
import com.example.fleet_backend.model.Role;
import com.example.fleet_backend.model.User;
import com.example.fleet_backend.repository.NotificationRepository;
import com.example.fleet_backend.repository.UserRepository;
import com.example.fleet_backend.security.AuthUtil;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    /**
     * ✅ Crée une notification UNIQUEMENT pour OWNER.
     * - ADMIN : jamais
     * - DRIVER : jamais
     * - autre : jamais
     */
    public void createForOwnerOnly(Long recipientId, String title, String message, Long missionId) {
        User u = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + recipientId));

        // ✅ BON: role name réel stocké en DB (ex: "ROLE_OWNER")
        String roleName = u.getRoleName(); // ✅ utilise ta méthode

        // ✅ ONLY OWNER
        if (!"ROLE_OWNER".equals(roleName)) {
            return; // do nothing
        }

        Notification n = new Notification();
        n.setRecipient(u);
        n.setTitle(title);
        n.setMessage(message);
        n.setMissionId(missionId);

        notificationRepository.save(n);
    }

    // ✅ OWNER: list my notifications
    public List<NotificationDTO> myNotifications(Authentication auth) {
        Long userId = AuthUtil.userId(auth);
        return notificationRepository.findTop30ByRecipientIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationDTO::new)
                .collect(Collectors.toList());
    }

    // ✅ OWNER: unread count
    public long myUnreadCount(Authentication auth) {
        Long userId = AuthUtil.userId(auth);
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    // ✅ OWNER: mark single as read
    public void markRead(Long notificationId, Authentication auth) {
        Long userId = AuthUtil.userId(auth);

        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));

        if (n.getRecipient() == null || !n.getRecipient().getId().equals(userId)) {
            throw new AccessDeniedException("Not your notification");
        }

        n.setRead(true);
        notificationRepository.save(n);
    }

    // ✅ OWNER: mark all as read (top 30)
    public void markAllRead(Authentication auth) {
        Long userId = AuthUtil.userId(auth);
        List<Notification> list = notificationRepository.findTop30ByRecipientIdOrderByCreatedAtDesc(userId);
        list.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(list);
    }
}