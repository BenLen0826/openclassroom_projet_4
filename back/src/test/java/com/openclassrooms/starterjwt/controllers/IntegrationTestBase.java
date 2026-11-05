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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Date;

/**
 * Classe de base de tous les tests d'intégration des controllers.
 *
 * Chaque classe de test d'intégration "hérite" de celle-ci (extends IntegrationTestBase) et récupère ainsi :
 * - les annotations qui démarrent l'application et fournissent MockMvc ;
 * - les objets utiles (MockMvc, repositories, ObjectMapper) ;
 * - des méthodes pour créer des données en base et obtenir un vrai token JWT.
 *
 * Elle est "abstract" : elle ne contient aucun test et ne peut pas être exécutée seule.
 * Son nom ne finit pas par "Test" : elle n'est donc pas comptée parmi les classes de test.
 */
// Démarre l'application Spring complète (sécurité, JPA, base H2 de src/test/resources/application.yml).
@SpringBootTest
// Fournit MockMvc : il envoie de vraies requêtes HTTP à l'application, sans démarrer de serveur réseau.
@AutoConfigureMockMvc
// Chaque test s'exécute dans une transaction annulée (rollback) à la fin : la base est vide au début de chaque test.
// ⚠️ Les ids auto-incrémentés, eux, ne repartent pas à 1 : ne jamais écrire un id en dur dans un test.
@Transactional
public abstract class IntegrationTestBase {

    /** Id qui n'existe jamais en base : utilisé pour tester les cas 404. */
    protected static final long UNKNOWN_ID = 999_999L;

    /** Mot de passe en clair des utilisateurs créés par createUser (stocké encodé en base). */
    protected static final String PASSWORD = "password123";

    // "protected" : ces champs sont accessibles dans les classes filles (les vrais tests).
    // @Autowired : Spring fournit les VRAIS objets de l'application (plus aucun mock ici).
    @Autowired
    protected MockMvc mockMvc;

    // Convertit un objet Java en JSON (corps des requêtes POST / PUT), avec la même configuration que l'application.
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
