package com.example.fleet_backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * ✅ EmailService
 *
 * Service responsable de l’envoi des emails dans l’application.
 *
 * Fonctionnalités:
 * - Envoi email de réinitialisation de mot de passe
 * - Envoi email d’activation de compte
 *
 * Utilise:
 * - JavaMailSender (fourni par spring-boot-starter-mail)
 * - SMTP configuré dans application.properties
 *
 * Pourquoi isoler l’email dans un service ?
 * - Séparation des responsabilités (SRP)
 * - Réutilisable
 * - Plus facile à tester / modifier (templates, provider, etc.)
 */
@Service
public class EmailService {

    /**
     * ✅ JavaMailSender:
     * - Composant Spring qui gère l’envoi d’emails via SMTP
     */
    private final JavaMailSender mailSender;

    /**
     * ✅ fromEmail:
     * - Email expéditeur (récupéré depuis application.properties)
     * - spring.mail.username
     */
    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * ✅ Injection par constructeur
     */
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * ✅ Envoi email de réinitialisation de mot de passe
     *
     * @param to        email du destinataire
     * @param resetLink lien frontend contenant le token (?token=...)
     *
     * Étapes:
     * 1) Créer MimeMessage
     * 2) Configurer expéditeur, destinataire, sujet
     * 3) Construire contenu HTML
     * 4) Envoyer via mailSender
     */
    public void sendPasswordResetEmail(String to, String resetLink) {
        try {
            // 1️⃣ Création du message email
            MimeMessage mimeMessage = mailSender.createMimeMessage();

            // true = multipart (HTML possible)
            // UTF-8 = support caractères spéciaux (é, 🔐, etc.)
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            // 2️⃣ Configuration des champs
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("🔐 Réinitialisation de votre mot de passe");

            /**
             * 3️⃣ Template HTML inline
             * - Utilise String.format via .formatted()
             * - resetLink injecté dans le bouton
             * - Style simple inline pour compatibilité email clients
             */
            String html = """
                <div style="font-family: Arial, sans-serif; line-height:1.6; max-width:600px; margin:auto">
                  <h2 style="color:#111;">Réinitialisation de mot de passe</h2>
                  <p>Bonjour,</p>
                  <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
                  <p>Cliquez sur le bouton ci-dessous (valide 15 minutes) :</p>
                  <p style="margin: 30px 0;">
                    <a href="%s"
                       style="background:#111;color:#fff;padding:14px 22px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;">
                      Réinitialiser mon mot de passe
                    </a>
                  </p>
                  <p style="color:#666;font-size: 13px;">
                    Si vous n’êtes pas à l’origine de cette demande, ignorez cet email.
                  </p>
                  <hr style="margin-top:30px;">
                  <p style="font-size:12px;color:#999;">Fleet Management System</p>
                </div>
            """.formatted(resetLink);

            // true = contenu HTML (sinon texte brut)
            helper.setText(html, true);

            // 4️⃣ Envoi
            mailSender.send(mimeMessage);

        } catch (MessagingException e) {
            // En cas d’erreur SMTP / format email
            throw new RuntimeException("Erreur lors de l'envoi de l'email de réinitialisation", e);
        }
    }

    /**
     * ✅ Envoi email d’activation de compte
     *
     * @param to              email destinataire
     * @param activationLink  lien frontend (?token=...)
     *
     * Logique similaire au reset password mais:
     * - Sujet différent
     * - Texte différent
     * - Durée validité 24h (logique côté service token)
     */
    public void sendAccountActivationEmail(String to, String activationLink) {
        try {

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("👤 Activation de votre compte Fleet");

            String html = """
                <div style="font-family: Arial, sans-serif; line-height:1.6; max-width:600px; margin:auto">
                  <h2 style="color:#111;">Activation de votre compte</h2>
                  <p>Bonjour,</p>
                  <p>Un administrateur a créé un compte pour vous sur la plateforme Fleet.</p>
                  <p>Pour activer votre compte et définir votre mot de passe, cliquez sur le bouton ci-dessous :</p>
                  <p style="margin: 30px 0;">
                    <a href="%s"
                       style="background:#111;color:#fff;padding:14px 22px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;">
                      Activer mon compte
                    </a>
                  </p>
                  <p style="color:#666;font-size: 13px;">Ce lien est valide pendant 24 heures.</p>
                  <hr style="margin-top:30px;">
                  <p style="font-size:12px;color:#999;">Fleet Management System</p>
                </div>
            """.formatted(activationLink);

            helper.setText(html, true);
            mailSender.send(mimeMessage);

        } catch (MessagingException e) {
            throw new RuntimeException("Erreur lors de l'envoi de l'email d'activation", e);
        }
    }
}