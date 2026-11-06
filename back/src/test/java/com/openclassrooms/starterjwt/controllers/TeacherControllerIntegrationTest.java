package com.openclassrooms.starterjwt.controllers;

import com.openclassrooms.starterjwt.models.Teacher;
import com.openclassrooms.starterjwt.models.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests d'intégration de TeacherController (/api/teacher).
 *
 * La requête traverse toute l'application : filtre JWT -> sécurité -> controller -> service -> repository -> base H2.
 * Les cas de sécurité communs à toutes les routes protégées (token absent, invalide...) sont testés ici,
 * une seule fois, sur la route la plus simple.
 */
class TeacherControllerIntegrationTest extends IntegrationTestBase {

    private User user;

    // Avant chaque test : un utilisateur existe en base (nécessaire pour que son token soit accepté).
    @BeforeEach
    void setUp() {
        user = createUser("john.doe@test.com", false);
    }

    // ---------- sécurité (valable pour toutes les routes /api/** sauf /api/auth/**) ----------

    @Test
    @DisplayName("GET /api/teacher sans token renvoie 401")
    void findAll_shouldReturn401_whenNoToken() throws Exception {
        // When : aucune en-tête Authorization
        mockMvc.perform(get("/api/teacher"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/teacher avec un token invalide renvoie 401")
    void findAll_shouldReturn401_whenTokenIsInvalid() throws Exception {
        mockMvc.perform(get("/api/teacher").header("Authorization", "Bearer token-invalide"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/teacher avec une en-tête Authorization qui n'est pas de type Bearer renvoie 401")
    void findAll_shouldReturn401_whenAuthorizationHeaderIsNotBearer() throws Exception {
        // Le filtre JWT ne lit que les en-têtes qui commencent par "Bearer "
        mockMvc.perform(get("/api/teacher").header("Authorization", "Basic am9objpwYXNzd29yZA=="))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/teacher avec le token d'un utilisateur qui n'existe plus renvoie 401")
    void findAll_shouldReturn401_whenTokenUserNoLongerExists() throws Exception {
        // Given : token valide (bien signé) d'un utilisateur qui n'est pas (ou plus) en base,
        // par exemple après la suppression de son compte
        User deletedUser = new User().setEmail("deleted@test.com").setFirstName("Old")
                .setLastName("User").setPassword("pwd").setAdmin(false);

        // When + Then : le filtre ne retrouve pas l'utilisateur, la requête reste non authentifiée
        mockMvc.perform(get("/api/teacher").header("Authorization", bearer(deletedUser)))
                .andExpect(status().isUnauthorized());
    }

    // ---------- GET /api/teacher ----------

    @Test
    @DisplayName("GET /api/teacher renvoie 200 et la liste des professeurs")
    void findAll_shouldReturn200AndAllTeachers() throws Exception {
        // Given : deux professeurs en base
        createTeacher("Margot", "DELAHAYE");
        createTeacher("Hélène", "THIERCELIN");

        mockMvc.perform(get("/api/teacher").header("Authorization", bearer(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].lastName", containsInAnyOrder("DELAHAYE", "THIERCELIN")));
    }

    // ---------- GET /api/teacher/{id} ----------

    @Test
    @DisplayName("GET /api/teacher/{id} renvoie 200 et le professeur demandé")
    void findById_shouldReturn200AndTeacher_whenTeacherExists() throws Exception {
        Teacher teacher = createTeacher("Margot", "DELAHAYE");

        mockMvc.perform(get("/api/teacher/{id}", teacher.getId()).header("Authorization", bearer(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(teacher.getId()))
                .andExpect(jsonPath("$.firstName").value("Margot"))
                .andExpect(jsonPath("$.lastName").value("DELAHAYE"));
    }

    @Test
    @DisplayName("GET /api/teacher/{id} renvoie 404 quand le professeur n'existe pas")
    void findById_shouldReturn404_whenTeacherDoesNotExist() throws Exception {
        mockMvc.perform(get("/api/teacher/{id}", UNKNOWN_ID).header("Authorization", bearer(user)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/teacher/{id} renvoie 400 quand l'id n'est pas un nombre")
    void findById_shouldReturn400_whenIdIsNotANumber() throws Exception {
        // "abc" ne peut pas être converti en Long : GlobalExceptionHandler renvoie 400
        mockMvc.perform(get("/api/teacher/abc").header("Authorization", bearer(user)))
                .andExpect(status().isBadRequest());
    }
}
