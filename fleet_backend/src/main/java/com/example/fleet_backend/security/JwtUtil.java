package com.example.fleet_backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

/**
 * ✅ JwtUtil
 *
 * Classe utilitaire pour gérer les JSON Web Tokens (JWT) :
 * - Générer un token après un login réussi
 * - Extraire l'utilisateur (email) depuis un token
 * - Valider un token (signature, expiration, structure)
 *
 * 📌 Pourquoi JWT ?
 * - Authentification stateless (sans session côté serveur)
 * - Chaque requête contient Authorization: Bearer <token>
 * - Le backend valide le token et autorise l'accès selon le rôle
 *
 * @Component :
 * - Rend cette classe injectable comme Bean Spring (utilisable dans services/filters)
 */
@Component
public class JwtUtil {

    /**
     * ✅ Logger
     * - Permet de tracer les erreurs JWT (debug + production)
     */
    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);

    /**
     * ✅ jwtSecret
     * - Clé secrète utilisée pour signer et vérifier les tokens (HMAC)
     * - Chargée depuis application.properties : jwt.secret=...
     *
     * ⚠️ Important:
     * - Doit rester SECRET (ne jamais la committer sur Git)
     * - Doit être longue (>= 32 bytes) pour HS256
     */
    @Value("${jwt.secret}")
    private String jwtSecret;

    /**
     * ✅ Durée d'expiration (ms)
     * - Chargée depuis application.properties : jwt.expiration=...
     * - Exemple: 86400000 ms = 1 jour
     */
    @Value("${jwt.expiration}")
    private int jwtExpirationMs;

    /**
     * ✅ Construit la clé de signature à partir de jwt.secret.
     *
     * - Utilise UTF-8 pour convertir la String en bytes
     * - Vérifie que la clé est assez longue (HS256 = 256 bits min)
     * - Crée une Key utilisable par JJWT
     */
    private Key getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);

        // ✅ Sécurité: empêche d'utiliser une clé trop courte (faible)
        if (keyBytes.length < 32) {
            throw new IllegalStateException("jwt.secret must be at least 32 bytes for HS256");
        }

        // ✅ Crée une clé HMAC (HS256)
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * ✅ Génère un token JWT après authentification réussie.
     *
     * Flow:
     * - authentication contient le principal authentifié (UserDetailsImpl)
     * - On met des "claims" dans le token:
     *   id, firstName, lastName, role
     * - On définit:
     *   issuedAt = date de création
     *   expiration = now + jwtExpirationMs
     * - On signe le token avec HS256 + clé
     *
     * @param authentication objet Authentication après login réussi
     * @return JWT en String (format: header.payload.signature)
     */
    public String generateJwtToken(Authentication authentication) {

        // ✅ Principal = utilisateur authentifié (ton UserDetailsImpl)
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();

        /**
         * ✅ Récupérer le rôle depuis authorities
         * - Ici tu prends le 1er rôle trouvé
         * - Valeur par défaut: ROLE_DRIVER (si jamais authorities vide)
         *
         * ⚠️ Si un user peut avoir plusieurs rôles, ce code ne garde qu'un seul.
         */
        String role = userPrincipal.getAuthorities()
                .stream()
                .findFirst()
                .map(a -> a.getAuthority())
                .orElse("ROLE_DRIVER");

        // ✅ Construction du JWT
        return Jwts.builder()

                // subject = identifiant principal (ici email)
                .setSubject(userPrincipal.getEmail())

                // Claims = infos ajoutées au payload JWT
                .claim("id", userPrincipal.getId())
                .claim("firstName", userPrincipal.getFirstName())
                .claim("lastName", userPrincipal.getLastName())
                .claim("role", role)

                // date création
                .setIssuedAt(new Date())

                // date expiration
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))

                // signature HS256
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)

                // retourne le token final
                .compact();
    }

    /**
     * ✅ Extraire le username (subject) depuis un token JWT.
     *
     * Ici:
     * - subject = email
     *
     * @param token JWT
     * @return email (subject)
     */
    public String getUserNameFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())  // ✅ vérifie la signature avec la même clé
                .build()
                .parseClaimsJws(token)           // ✅ parse + validation signature
                .getBody()
                .getSubject();                   // ✅ subject = email
    }

    /**
     * ✅ Valide un JWT.
     *
     * Vérifications:
     * - token bien formé
     * - signature correcte
     * - token non expiré
     * - token supporté
     *
     * Si tout est OK -> true
     * Sinon -> false + log d'erreur.
     *
     * @param authToken JWT à vérifier
     * @return true si valide, false sinon
     */
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(authToken); // ✅ si exception => token invalide

            return true;

        } catch (MalformedJwtException e) {
            // ❌ Token mal formé (structure invalide)
            logger.error("Invalid JWT token: {}", e.getMessage());

        } catch (ExpiredJwtException e) {
            // ❌ Token expiré
            logger.error("JWT token is expired: {}", e.getMessage());

        } catch (UnsupportedJwtException e) {
            // ❌ Format/algorithme non supporté
            logger.error("JWT token is unsupported: {}", e.getMessage());

        } catch (IllegalArgumentException e) {
            // ❌ Token vide/null ou claims invalides
            logger.error("JWT claims string is empty: {}", e.getMessage());

        } catch (Exception e) {
            // ❌ Toute autre erreur (ex: clé invalide)
            logger.error("JWT validation error: {}", e.getMessage());
        }

        return false;
    }
}