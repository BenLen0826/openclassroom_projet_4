package com.openclassrooms.starterjwt.security.jwt;

import com.openclassrooms.starterjwt.security.services.UserDetailsImpl;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Tests unitaires de JwtUtils : création, lecture et validation des tokens JWT.
 * Pas de Mockito ici : JwtUtils n'a aucune dépendance, on utilise directement la vraie classe.
 */
class JwtUtilsTest {

    // Clés de test uniquement, encodées en Base64 (64 octets, minimum exigé par l'algorithme HS512).
    private static final String SECRET =
            "rYyrxkj1Z+23pUvjo+sIm8rIPo79QEWjWSps/C3L8Frm8p1zW1C6ciJYLkhMtYr/ysHUabv62DqdiuYJyA5GOA==";
    private static final String OTHER_SECRET =
            "VA0VJIDQNapJPH61L3bOLbhGb7suFNQCBPIGLwk2VLtZswwauoZnYV7Yl1uM71IzsYG61hNX1iAJqnfIsWIuaA==";
    private static final long ONE_DAY_MS = 86_400_000L;

    private JwtUtils jwtUtils;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        jwtUtils = createJwtUtils(SECRET, ONE_DAY_MS);

        // Authentication réelle (pas un mock) : JwtUtils lit seulement le principal pour connaître l'email.
        UserDetailsImpl userDetails = UserDetailsImpl.builder()
                .id(1L)
                .username("john.doe@test.com")
                .firstName("John")
                .lastName("Doe")
                .password("encoded-password")
                .build();
        authentication = new UsernamePasswordAuthenticationToken(userDetails, null);
    }

    /**
     * Les champs jwtSecret et jwtExpirationMs sont normalement remplis par Spring (@Value) au démarrage.
     * Sans Spring, ReflectionTestUtils.setField permet de remplir ces champs privés directement.
     */
    private JwtUtils createJwtUtils(String secret, long expirationMs) {
        JwtUtils utils = new JwtUtils();
        ReflectionTestUtils.setField(utils, "jwtSecret", secret);
        ReflectionTestUtils.setField(utils, "jwtExpirationMs", (int) expirationMs);
        return utils;
    }

    @Test
    @DisplayName("generateJwtToken crée un token dont on peut relire l'email de l'utilisateur")
    void generateJwtToken_shouldCreateTokenContainingUsername() {
        // When
        String token = jwtUtils.generateJwtToken(authentication);

        // Then : getUserNameFromJwtToken retrouve l'email placé dans le token ("subject")
        assertEquals("john.doe@test.com", jwtUtils.getUserNameFromJwtToken(token));
    }

    @Test
    @DisplayName("validateJwtToken renvoie true pour un token valide")
    void validateJwtToken_shouldReturnTrue_whenTokenIsValid() {
        // Given
        String token = jwtUtils.generateJwtToken(authentication);

        // When + Then
        assertTrue(jwtUtils.validateJwtToken(token));
    }

    @Test
    @DisplayName("validateJwtToken renvoie false pour un token signé avec une autre clé")
    void validateJwtToken_shouldReturnFalse_whenSignatureIsInvalid() {
        // Given : token fabriqué par une autre application (autre clé secrète)
        String tokenFromOtherKey = createJwtUtils(OTHER_SECRET, ONE_DAY_MS).generateJwtToken(authentication);

        // When + Then : la signature ne correspond pas (SignatureException attrapée dans JwtUtils)
        assertFalse(jwtUtils.validateJwtToken(tokenFromOtherKey));
    }

    @Test
    @DisplayName("validateJwtToken renvoie false pour un token mal formé")
    void validateJwtToken_shouldReturnFalse_whenTokenIsMalformed() {
        // When + Then : ce texte n'est pas un JWT (MalformedJwtException)
        assertFalse(jwtUtils.validateJwtToken("abc.def.ghi"));
    }

    @Test
    @DisplayName("validateJwtToken renvoie false pour un token expiré")
    void validateJwtToken_shouldReturnFalse_whenTokenIsExpired() {
        // Given : une durée de validité négative produit un token déjà expiré au moment de sa création
        String expiredToken = createJwtUtils(SECRET, -1_000L).generateJwtToken(authentication);

        // When + Then : ExpiredJwtException
        assertFalse(jwtUtils.validateJwtToken(expiredToken));
    }

    @Test
    @DisplayName("validateJwtToken renvoie false pour un token non signé")
    void validateJwtToken_shouldReturnFalse_whenTokenIsUnsigned() {
        // Given : un JWT sans signature (n'importe qui pourrait le fabriquer)
        String unsignedToken = Jwts.builder().subject("john.doe@test.com").compact();

        // When + Then : JwtUtils exige un token signé (UnsupportedJwtException)
        assertFalse(jwtUtils.validateJwtToken(unsignedToken));
    }

    @Test
    @DisplayName("validateJwtToken renvoie false pour un token vide")
    void validateJwtToken_shouldReturnFalse_whenTokenIsEmpty() {
        // When + Then : IllegalArgumentException
        assertFalse(jwtUtils.validateJwtToken(""));
    }
}
