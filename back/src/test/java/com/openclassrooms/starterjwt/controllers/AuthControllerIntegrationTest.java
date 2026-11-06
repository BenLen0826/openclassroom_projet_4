package com.openclassrooms.starterjwt.controllers;

import com.openclassrooms.starterjwt.models.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests d'intégration de AuthController (/api/auth) : features "Login" et "Register" du plan de test.
 * Ces routes sont publiques : aucun token n'est envoyé.
 * Contrairement à AuthServiceTest, le mot de passe est ici VRAIMENT vérifié (BCrypt + base H2).
 */
class AuthControllerIntegrationTest extends IntegrationTestBase {

    @Autowired
    private PasswordEncoder passwordEncoder;

    /** Transforme une Map en texte JSON, ex. Map.of("email", "a@b.c") -> {"email":"a@b.c"}. */
    private String json(Map<String, String> body) throws Exception {
        return objectMapper.writeValueAsString(body);
    }

    private Map<String, String> validSignup() {
        return Map.of(
                "email", "jane.doe@test.com",
                "firstName", "Jane",
                "lastName", "Doe",
                "password", "password123");
    }

    // ---------- POST /api/auth/login ----------

    @Test
    @DisplayName("POST /api/auth/login avec de bons identifiants renvoie 200, le token et les informations de l'utilisateur")
    void login_shouldReturn200AndJwt_whenCredentialsAreValid() throws Exception {
        // Given : un administrateur existe en base (mot de passe PASSWORD encodé)
        User admin = createUser("yoga@studio.com", true);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "yoga@studio.com", "password", PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.type").value("Bearer"))
                .andExpect(jsonPath("$.id").value(admin.getId()))
                .andExpect(jsonPath("$.username").value("yoga@studio.com"))
                .andExpect(jsonPath("$.firstName").value("John"))
                .andExpect(jsonPath("$.lastName").value("Doe"))
                // C'est ce champ qui permet au front d'afficher les boutons réservés aux administrateurs
                .andExpect(jsonPath("$.admin").value(true));
    }

    @Test
    @DisplayName("POST /api/auth/login avec un mauvais mot de passe renvoie 401")
    void login_shouldReturn401_whenPasswordIsWrong() throws Exception {
        createUser("yoga@studio.com", true);

        // When + Then : BadCredentialsException est transformée en 401 par Spring Security
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "yoga@studio.com", "password", "mauvais-mot-de-passe"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/auth/login avec un email inconnu renvoie 401")
    void login_shouldReturn401_whenEmailIsUnknown() throws Exception {
        // Aucun utilisateur en base
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "inconnu@test.com", "password", PASSWORD))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/auth/login sans mot de passe renvoie 400")
    void login_shouldReturn400_whenPasswordIsMissing() throws Exception {
        // @NotBlank sur LoginRequest.password + @Valid dans le controller -> 400
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "yoga@studio.com"))))
                .andExpect(status().isBadRequest());
    }

    // ---------- POST /api/auth/register ----------

    @Test
    @DisplayName("POST /api/auth/register avec des données valides renvoie 200 et crée le compte avec un mot de passe encodé")
    void register_shouldReturn200AndCreateUser_whenDataIsValid() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(validSignup())))
                // Then (1) : la réponse
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User registered successfully!"));

        // Then (2) : le compte existe en base, non administrateur, avec le mot de passe encodé (jamais en clair)
        User saved = userRepository.findByEmail("jane.doe@test.com").orElseThrow();
        assertEquals("Jane", saved.getFirstName());
        assertEquals("Doe", saved.getLastName());
        assertFalse(saved.isAdmin());
        assertTrue(passwordEncoder.matches("password123", saved.getPassword()));
    }

    @Test
    @DisplayName("POST /api/auth/register avec un email déjà utilisé renvoie 400 et un message d'erreur")
    void register_shouldReturn400WithMessage_whenEmailIsAlreadyTaken() throws Exception {
        // Given : un compte existe déjà avec cet email
        createUser("jane.doe@test.com", false);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(validSignup())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Error: Email is already taken!"));
    }

    @Test
    @DisplayName("POST /api/auth/register sans prénom renvoie 400 et ne crée pas de compte")
    void register_shouldReturn400_whenFirstNameIsMissing() throws Exception {
        // Given : toutes les données sauf le prénom
        Map<String, String> body = Map.of(
                "email", "jane.doe@test.com",
                "lastName", "Doe",
                "password", "password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body)))
                .andExpect(status().isBadRequest());

        assertFalse(userRepository.existsByEmail("jane.doe@test.com"));
    }

    @Test
    @DisplayName("POST /api/auth/register avec un JSON mal formé renvoie 400")
    void register_shouldReturn400_whenJsonIsMalformed() throws Exception {
        // Le corps n'est pas du JSON valide (accolade fermante manquante) : HttpMessageNotReadableException
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"jane.doe@test.com\""))
                .andExpect(status().isBadRequest());
    }
}
