package com.openclassrooms.starterjwt.controllers;

import com.openclassrooms.starterjwt.dto.SessionDto;
import com.openclassrooms.starterjwt.models.Session;
import com.openclassrooms.starterjwt.models.Teacher;
import com.openclassrooms.starterjwt.models.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Date;
import java.util.List;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests d'intégration de SessionController (/api/session) : features "Sessions", "Informations session",
 * "Création session", "Modification session" et "Suppression session" du plan de test, plus la participation.
 *
 * ⚠️ Session.teacher est en @OneToOne : Hibernate n'autorise qu'UNE session par professeur.
 * Les tests qui ont besoin de deux sessions utilisent donc deux professeurs différents.
 */
class SessionControllerIntegrationTest extends IntegrationTestBase {

    private User user;
    private Teacher teacher;
    private String token;

    @BeforeEach
    void setUp() {
        user = createUser("yoga@studio.com", true);
        teacher = createTeacher("Margot", "DELAHAYE");
        token = bearer(user);
    }

    /** Corps JSON d'une session valide, tel que l'envoie le formulaire du front. */
    private SessionDto sessionBody(String name, Long teacherId) {
        SessionDto dto = new SessionDto();
        dto.setName(name);
        dto.setDate(new Date());
        dto.setDescription("Séance douce pour bien commencer la journée");
        dto.setTeacher_id(teacherId);
        dto.setUsers(List.of());
        return dto;
    }

    private String json(Object body) throws Exception {
        return objectMapper.writeValueAsString(body);
    }

    // ---------- Sessions : GET /api/session ----------

    @Test
    @DisplayName("GET /api/session renvoie 200 et la liste des sessions")
    void findAll_shouldReturn200AndAllSessions() throws Exception {
        // Given : deux sessions (deux professeurs, à cause du @OneToOne)
        createSession("Yoga du matin", teacher);
        createSession("Yoga du soir", createTeacher("Hélène", "THIERCELIN"));

        mockMvc.perform(get("/api/session").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].name", containsInAnyOrder("Yoga du matin", "Yoga du soir")));
    }

    @Test
    @DisplayName("GET /api/session sans token renvoie 401")
    void findAll_shouldReturn401_whenNoToken() throws Exception {
        mockMvc.perform(get("/api/session"))
                .andExpect(status().isUnauthorized());
    }

    // ---------- Informations session : GET /api/session/{id} ----------

    @Test
    @DisplayName("GET /api/session/{id} renvoie 200 et les informations de la session")
    void findById_shouldReturn200AndSessionInfo() throws Exception {
        // Given : une session avec un participant
        Session session = createSession("Yoga du matin", teacher);
        session.getUsers().add(user);
        sessionRepository.save(session);

        mockMvc.perform(get("/api/session/{id}", session.getId()).header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(session.getId()))
                .andExpect(jsonPath("$.name").value("Yoga du matin"))
                .andExpect(jsonPath("$.description").value("Description de Yoga du matin"))
                .andExpect(jsonPath("$.date").isNotEmpty())
                .andExpect(jsonPath("$.teacher_id").value(teacher.getId()))
                // Le mapper renvoie les ids des participants, pas les objets complets
                .andExpect(jsonPath("$.users", hasSize(1)))
                .andExpect(jsonPath("$.users[0]").value(user.getId()));
    }

    @Test
    @DisplayName("GET /api/session/{id} renvoie 404 quand la session n'existe pas")
    void findById_shouldReturn404_whenSessionDoesNotExist() throws Exception {
        mockMvc.perform(get("/api/session/{id}", UNKNOWN_ID).header("Authorization", token))
                .andExpect(status().isNotFound());
    }

    // ---------- Création session : POST /api/session ----------

    @Test
    @DisplayName("POST /api/session avec des données valides renvoie 200 et crée la session")
    void create_shouldReturn200AndCreateSession_whenDataIsValid() throws Exception {
        mockMvc.perform(post("/api/session")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(sessionBody("Yoga du matin", teacher.getId()))))
                // Then (1) : la session créée est renvoyée, avec l'id généré par la base
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Yoga du matin"))
                .andExpect(jsonPath("$.teacher_id").value(teacher.getId()));

        // Then (2) : elle est bien en base
        List<Session> sessions = sessionRepository.findAll();
        assertEquals(1, sessions.size());
        assertEquals("Yoga du matin", sessions.get(0).getName());
    }

    @Test
    @DisplayName("POST /api/session sans nom renvoie 400 et ne crée pas de session")
    void create_shouldReturn400_whenNameIsMissing() throws Exception {
        // Given : @NotBlank sur SessionDto.name
        SessionDto body = sessionBody(null, teacher.getId());

        mockMvc.perform(post("/api/session")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body)))
                .andExpect(status().isBadRequest());

        assertEquals(0, sessionRepository.count());
    }

    @Test
    @DisplayName("POST /api/session sans professeur renvoie 400 et ne crée pas de session")
    void create_shouldReturn400_whenTeacherIdIsMissing() throws Exception {
        // Given : @NotNull sur SessionDto.teacher_id (le professeur est obligatoire dans le formulaire)
        SessionDto body = sessionBody("Yoga du matin", null);

        mockMvc.perform(post("/api/session")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body)))
                .andExpect(status().isBadRequest());

        assertEquals(0, sessionRepository.count());
    }

    @Test
    @DisplayName("POST /api/session avec un professeur inconnu renvoie 404 et ne crée pas de session")
    void create_shouldReturn404_whenTeacherDoesNotExist() throws Exception {
        mockMvc.perform(post("/api/session")
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(sessionBody("Yoga du matin", UNKNOWN_ID))))
                .andExpect(status().isNotFound());

        assertEquals(0, sessionRepository.count());
    }

    // ---------- Modification session : PUT /api/session/{id} ----------

    @Test
    @DisplayName("PUT /api/session/{id} avec des données valides renvoie 200 et modifie la session")
    void update_shouldReturn200AndUpdateSession_whenDataIsValid() throws Exception {
        Session session = createSession("Yoga du matin", teacher);

        // When : on renomme la session
        mockMvc.perform(put("/api/session/{id}", session.getId())
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(sessionBody("Yoga du soir", teacher.getId()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(session.getId()))
                .andExpect(jsonPath("$.name").value("Yoga du soir"));

        // Then (2) : c'est bien la même session qui a été modifiée (pas une nouvelle créée)
        assertEquals(1, sessionRepository.count());
        assertEquals("Yoga du soir", sessionRepository.findById(session.getId()).orElseThrow().getName());
    }

    @Test
    @DisplayName("PUT /api/session/{id} sans description renvoie 400 et ne modifie pas la session")
    void update_shouldReturn400_whenDescriptionIsMissing() throws Exception {
        // Given : @NotNull sur SessionDto.description
        Session session = createSession("Yoga du matin", teacher);
        SessionDto body = sessionBody("Yoga du soir", teacher.getId());
        body.setDescription(null);

        mockMvc.perform(put("/api/session/{id}", session.getId())
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(body)))
                .andExpect(status().isBadRequest());

        assertEquals("Yoga du matin", sessionRepository.findById(session.getId()).orElseThrow().getName());
    }

    @Test
    @DisplayName("PUT /api/session/{id} renvoie 404 quand la session n'existe pas")
    void update_shouldReturn404_whenSessionDoesNotExist() throws Exception {
        mockMvc.perform(put("/api/session/{id}", UNKNOWN_ID)
                        .header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(sessionBody("Yoga du soir", teacher.getId()))))
                .andExpect(status().isNotFound());

        assertEquals(0, sessionRepository.count());
    }

    // ---------- Suppression session : DELETE /api/session/{id} ----------

    @Test
    @DisplayName("DELETE /api/session/{id} renvoie 200 et supprime la session")
    void delete_shouldReturn200AndDeleteSession_whenSessionExists() throws Exception {
        Session session = createSession("Yoga du matin", teacher);

        mockMvc.perform(delete("/api/session/{id}", session.getId()).header("Authorization", token))
                .andExpect(status().isOk());

        assertFalse(sessionRepository.existsById(session.getId()));
    }

    @Test
    @DisplayName("DELETE /api/session/{id} renvoie 404 quand la session n'existe pas")
    void delete_shouldReturn404_whenSessionDoesNotExist() throws Exception {
        mockMvc.perform(delete("/api/session/{id}", UNKNOWN_ID).header("Authorization", token))
                .andExpect(status().isNotFound());
    }

    // ---------- Participation : POST / DELETE /api/session/{id}/participate/{userId} ----------

    @Test
    @DisplayName("POST /api/session/{id}/participate/{userId} renvoie 200 et inscrit l'utilisateur")
    void participate_shouldReturn200AndAddUser() throws Exception {
        Session session = createSession("Yoga du matin", teacher);

        mockMvc.perform(post("/api/session/{id}/participate/{userId}", session.getId(), user.getId())
                        .header("Authorization", token))
                .andExpect(status().isOk());

        assertTrue(sessionRepository.findById(session.getId()).orElseThrow().getUsers().contains(user));
    }

    @Test
    @DisplayName("POST /api/session/{id}/participate/{userId} renvoie 400 quand l'utilisateur participe déjà")
    void participate_shouldReturn400_whenUserAlreadyParticipates() throws Exception {
        // Given : l'utilisateur est déjà inscrit
        Session session = createSession("Yoga du matin", teacher);
        session.getUsers().add(user);
        sessionRepository.save(session);

        mockMvc.perform(post("/api/session/{id}/participate/{userId}", session.getId(), user.getId())
                        .header("Authorization", token))
                .andExpect(status().isBadRequest());

        // Il n'a pas été inscrit une deuxième fois
        assertEquals(1, sessionRepository.findById(session.getId()).orElseThrow().getUsers().size());
    }

    @Test
    @DisplayName("POST /api/session/{id}/participate/{userId} renvoie 404 quand l'utilisateur n'existe pas")
    void participate_shouldReturn404_whenUserDoesNotExist() throws Exception {
        Session session = createSession("Yoga du matin", teacher);

        mockMvc.perform(post("/api/session/{id}/participate/{userId}", session.getId(), UNKNOWN_ID)
                        .header("Authorization", token))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /api/session/{id}/participate/{userId} renvoie 200 et désinscrit l'utilisateur")
    void noLongerParticipate_shouldReturn200AndRemoveUser() throws Exception {
        // Given : l'utilisateur est inscrit
        Session session = createSession("Yoga du matin", teacher);
        session.getUsers().add(user);
        sessionRepository.save(session);

        mockMvc.perform(delete("/api/session/{id}/participate/{userId}", session.getId(), user.getId())
                        .header("Authorization", token))
                .andExpect(status().isOk());

        assertTrue(sessionRepository.findById(session.getId()).orElseThrow().getUsers().isEmpty());
    }

    @Test
    @DisplayName("DELETE /api/session/{id}/participate/{userId} renvoie 400 quand l'utilisateur ne participe pas")
    void noLongerParticipate_shouldReturn400_whenUserDoesNotParticipate() throws Exception {
        // Given : session sans participant
        Session session = createSession("Yoga du matin", teacher);

        mockMvc.perform(delete("/api/session/{id}/participate/{userId}", session.getId(), user.getId())
                        .header("Authorization", token))
                .andExpect(status().isBadRequest());
    }
}
