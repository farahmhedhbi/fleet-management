package com.example.fleet_backend.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String to, String resetLink) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(to);
        msg.setSubject("Réinitialisation de mot de passe");
        msg.setText(
                "Bonjour,\n\n" +
                        "Clique sur ce lien pour réinitialiser ton mot de passe (valide 15 minutes):\n" +
                        resetLink + "\n\n" +
                        "Si tu n'as pas demandé ça, ignore cet email."
        );
        mailSender.send(msg);
    }
}
