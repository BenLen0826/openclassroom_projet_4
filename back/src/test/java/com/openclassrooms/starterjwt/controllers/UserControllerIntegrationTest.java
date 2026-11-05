package com.openclassrooms.starterjwt.controllers;

import com.openclassrooms.starterjwt.models.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests d'intégration de UserController (/api/user) : feature "Account" du plan de test
 * (affichage des informations de l'utilisateur et suppression de son compte).
 */
class UserControllerIntegrationTest extends IntegrationTestBase {

    private User user;

    @BeforeEach
    void setUp() {
        user = createUser("john.doe@test.com", false);
    }

    // ---------- GET /api/user/{id} ----------

    @Test
    @DisplayName("GET /api/user/{id} renvoie 200 et les informations de l'utilisateur, sans son mot de passe")
    void findById_shouldReturn200AndUserInfoWithoutPassword() throws Exception {
        mockMvc.perform(get("/api/user/{id}", user.getId()).header("Authorization", bearer(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(user.getId()))
                .andExpect(jsonPath("$.email").value("john.doe@test.com"))
                .andExpect(jsonPath("$.firstName").value("John"))
                .andExpect(jsonPath("$.lastName").value("Doe"))
                .andExpect(jsonPath("$.admin").value(false))
                // Sécurité : @JsonIgnore sur UserDto.password empêche le mot de passe de sortir dans le JSON
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    @DisplayName("GET /api/user/{id} renvoie 404 quand l'utilisateur n'existe pas")
    void findById_shouldReturn404_whenUserDoesNotExist() throws Exception {
        mockMvc.perform(get("/api/user/{id}", UNKNOWN_ID).header("Authorization", bearer(user)))
                .andExpect(status().isNotFound());
    }

    // ---------- DELETE /api/user/{id} ----------

    @Test
    @DisplayName("DELETE /api/user/{id} sur son propre compte renvoie 200 et supprime l'utilisateur")
    void delete_shouldReturn200AndDeleteUser_whenDeletingOwnAccount() throws Exception {
        // When
        mockMvc.perform(delete("/api/user/{id}", user.getId()).header("Authorization", bearer(user)))
                // Then (1) : la réponse HTTP
                .andExpect(status().isOk());

        // Then (2) : l'état de la base
        assertFalse(userRepository.existsById(user.getId()));
    }

    @Test
    @DisplayName("DELETE /api/user/{id} sur le compte d'un autre utilisateur renvoie 401 et ne supprime rien")
    void delete_shouldReturn401AndKeepUser_whenDeletingAnotherUserAccount() throws Exception {
        // Given : un deuxième utilisateur, connecté, tente de supprimer le compte du premier
        User otherUser = createUser("jane.doe@test.com", false);

        // When
        mockMvc.perform(delete("/api/user/{id}", user.getId()).header("Authorization", bearer(otherUser)))
                // Then
                .andExpect(status().isUnauthorized());

        assertTrue(userRepository.existsById(user.getId()));
    }

    @Test
    @DisplayName("DELETE /api/user/{id} renvoie 404 quand l'utilisateur n'existe pas")
    void delete_shouldReturn404_whenUserDoesNotExist() throws Exception {
        mockMvc.perform(delete("/api/user/{id}", UNKNOWN_ID).header("Authorization", bearer(user)))
                .andExpect(status().isNotFound());
    }
}
