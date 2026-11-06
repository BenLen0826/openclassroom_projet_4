package com.openclassrooms.starterjwt.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.openclassrooms.starterjwt.models.Session;
import com.openclassrooms.starterjwt.models.Teacher;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.SessionRepository;
import com.openclassrooms.starterjwt.repository.TeacherRepository;
import com.openclassrooms.starterjwt.repository.UserRepository;
import com.openclassrooms.starterjwt.security.jwt.JwtUtils;
import com.openclassrooms.starterjwt.security.services.UserDetailsImpl;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.Date;

/**
 * Classe de base de tous les tests d'intégration des controllers.
 *
 * Démarre l'application complète (sécurité, JPA, base H2 de src/test/resources/application.yml) avec MockMvc,
 * et fournit les helpers de création de données et de token JWT.
 * Son nom ne finit pas par "Test" : Surefire ne la prend pas pour une classe de test.
 */
@SpringBootTest
@AutoConfigureMockMvc
// Pas de @Transactional sur les tests : chaque requête MockMvc utilise ses propres transactions, comme en production.
// Avec @Transactional, la transaction du test englobait aussi la requête : Hibernate enregistrait alors
// automatiquement les objets modifiés, et un test passait même si le service oubliait d'appeler save().
// La base est donc vidée avant chaque test (voir cleanDatabase).
// ⚠️ Les ids auto-incrémentés ne repartent pas à 1 : ne jamais écrire un id en dur dans un test.
public abstract class IntegrationTestBase {

    /** Id qui n'existe jamais en base : utilisé pour tester les cas 404. */
    protected static final long UNKNOWN_ID = 999_999L;

    /** Mot de passe en clair des utilisateurs créés par createUser (stocké encodé en base). */
    protected static final String PASSWORD = "password123";

    @Autowired
    protected MockMvc mockMvc;

    // Même configuration Jackson que l'application, pour sérialiser les corps des requêtes.
    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected TeacherRepository teacherRepository;

    @Autowired
    protected SessionRepository sessionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    /**
     * Vide la base avant chaque test, pour que chaque test démarre d'une base vide et ne dépende pas des autres.
     * JUnit exécute ce @BeforeEach avant ceux des classes filles.
     * Ordre imposé par les clés étrangères : d'abord les sessions (avec leurs participations), puis les
     * professeurs et les utilisateurs qu'elles référencent.
     */
    @BeforeEach
    void cleanDatabase() {
        sessionRepository.deleteAll();
        teacherRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ---------- création de données en base ----------

    /** Enregistre un utilisateur en base, avec le mot de passe PASSWORD encodé comme le fait l'inscription. */
    protected User createUser(String email, boolean admin) {
        User user = new User()
                .setEmail(email)
                .setFirstName("John")
                .setLastName("Doe")
                .setPassword(passwordEncoder.encode(PASSWORD))
                .setAdmin(admin);
        return userRepository.save(user);
    }

    /** Enregistre un professeur en base. */
    protected Teacher createTeacher(String firstName, String lastName) {
        return teacherRepository.save(new Teacher().setFirstName(firstName).setLastName(lastName));
    }

    /** Enregistre une session (sans participant) en base. */
    protected Session createSession(String name, Teacher teacher) {
        Session session = new Session()
                .setName(name)
                .setDate(new Date())
                .setDescription("Description de " + name)
                .setTeacher(teacher)
                .setUsers(new ArrayList<>());
        return sessionRepository.save(session);
    }

    // ---------- authentification ----------

    /**
     * Fabrique un vrai token JWT pour cet utilisateur, signé avec la clé de test.
     * Utilisé avec .header("Authorization", bearer(user)), la requête passe par le vrai AuthTokenFilter,
     * comme en production. L'utilisateur doit exister en base, car le filtre le recharge à partir de son email.
     */
    protected String bearer(User user) {
        UserDetailsImpl userDetails = UserDetailsImpl.builder()
                .id(user.getId())
                .username(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .password(user.getPassword())
                .build();
        String token = jwtUtils.generateJwtToken(new UsernamePasswordAuthenticationToken(userDetails, null));
        return "Bearer " + token;
    }
}
