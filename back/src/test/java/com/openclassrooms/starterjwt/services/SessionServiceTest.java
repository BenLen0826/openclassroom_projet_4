package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.exception.BadRequestException;
import com.openclassrooms.starterjwt.exception.NotFoundException;
import com.openclassrooms.starterjwt.models.Session;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.SessionRepository;
import com.openclassrooms.starterjwt.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests unitaires de SessionService.
 * Règles métier testées : existence de la session et de l'utilisateur,
 * interdiction de participer deux fois, interdiction de se désinscrire sans participer.
 */
@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SessionService sessionService;

    private Session session;
    private User user;

    @BeforeEach
    void setUp() {
        user = new User()
                .setId(10L)
                .setEmail("john.doe@test.com")
                .setFirstName("John")
                .setLastName("Doe")
                .setPassword("encoded-password")
                .setAdmin(false);

        // ⚠️ new ArrayList<>() et non List.of() : participate() fait un add() sur cette liste,
        // et une liste créée avec List.of() est non modifiable (UnsupportedOperationException).
        session = new Session()
                .setId(1L)
                .setName("Yoga du matin")
                .setDate(new Date())
                .setDescription("Séance douce pour bien commencer la journée")
                .setUsers(new ArrayList<>());
    }

    // ---------- create / findAll / getById ----------

    @Test
    @DisplayName("create enregistre la session et renvoie la session sauvegardée")
    void create_shouldSaveAndReturnSession() {
        // Given : save renvoie la session (en vrai, avec l'id généré par la base)
        when(sessionRepository.save(session)).thenReturn(session);

        Session result = sessionService.create(session);

        assertSame(session, result);
        verify(sessionRepository).save(session);
    }

    @Test
    @DisplayName("findAll renvoie la liste des sessions fournie par le repository")
    void findAll_shouldReturnAllSessions() {
        List<Session> sessions = List.of(session);
        when(sessionRepository.findAll()).thenReturn(sessions);

        List<Session> result = sessionService.findAll();

        assertEquals(sessions, result);
    }

    @Test
    @DisplayName("getById renvoie la session quand elle existe")
    void getById_shouldReturnSession_whenSessionExists() {
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));

        Session result = sessionService.getById(1L);

        assertSame(session, result);
    }

    @Test
    @DisplayName("getById lève NotFoundException quand la session n'existe pas")
    void getById_shouldThrowNotFoundException_whenSessionDoesNotExist() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> sessionService.getById(99L));
    }

    // ---------- delete ----------

    @Test
    @DisplayName("delete supprime la session quand elle existe")
    void delete_shouldDeleteSession_whenSessionExists() {
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));

        sessionService.delete(1L);

        // Then : c'est bien la session trouvée qui est supprimée
        verify(sessionRepository).delete(session);
    }

    @Test
    @DisplayName("delete lève NotFoundException et ne supprime rien quand la session n'existe pas")
    void delete_shouldThrowNotFoundException_whenSessionDoesNotExist() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> sessionService.delete(99L));
        verify(sessionRepository, never()).delete(any());
    }

    // ---------- update ----------

    @Test
    @DisplayName("update enregistre la session avec l'id passé en paramètre quand elle existe")
    void update_shouldSaveSessionWithGivenId_whenSessionExists() {
        // Given : la session 1 existe en base ; les nouvelles données arrivent sans id (comme depuis le front)
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        Session newData = new Session()
                .setName("Yoga du soir")
                .setDate(new Date())
                .setDescription("Séance relaxante")
                .setUsers(new ArrayList<>());
        when(sessionRepository.save(any(Session.class))).thenReturn(newData);

        Session result = sessionService.update(1L, newData);

        // Then : on récupère la session passée à save()
        ArgumentCaptor<Session> captor = ArgumentCaptor.forClass(Session.class);
        verify(sessionRepository).save(captor.capture());
        Session savedSession = captor.getValue();
        // Le service doit avoir forcé l'id : sinon save() créerait une NOUVELLE session au lieu de modifier la 1.
        assertEquals(1L, savedSession.getId());
        assertEquals("Yoga du soir", savedSession.getName());
        assertSame(newData, result);
    }

    @Test
    @DisplayName("update lève NotFoundException et n'enregistre rien quand la session n'existe pas")
    void update_shouldThrowNotFoundException_whenSessionDoesNotExist() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> sessionService.update(99L, session));
        verify(sessionRepository, never()).save(any());
    }

    // ---------- participate ----------

    @Test
    @DisplayName("participate ajoute l'utilisateur à la session et l'enregistre")
    void participate_shouldAddUserAndSave_whenUserDoesNotParticipateYet() {
        // Given : la session existe, l'utilisateur existe et ne participe pas encore
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));

        sessionService.participate(1L, 10L);

        // Then : l'utilisateur fait partie des participants et la session a été enregistrée
        assertTrue(session.getUsers().contains(user));
        verify(sessionRepository).save(session);
    }

    @Test
    @DisplayName("participate lève NotFoundException quand la session n'existe pas")
    void participate_shouldThrowNotFoundException_whenSessionDoesNotExist() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> sessionService.participate(99L, 10L));
        verify(sessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("participate lève NotFoundException quand l'utilisateur n'existe pas")
    void participate_shouldThrowNotFoundException_whenUserDoesNotExist() {
        // Given : la session existe mais pas l'utilisateur
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> sessionService.participate(1L, 99L));
        verify(sessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("participate lève BadRequestException quand l'utilisateur participe déjà")
    void participate_shouldThrowBadRequestException_whenUserAlreadyParticipates() {
        // Given : l'utilisateur est déjà dans la liste des participants
        session.getUsers().add(user);
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));

        assertThrows(BadRequestException.class, () -> sessionService.participate(1L, 10L));
        // L'utilisateur n'a pas été ajouté une deuxième fois et rien n'a été enregistré
        assertEquals(1, session.getUsers().size());
        verify(sessionRepository, never()).save(any());
    }

    // ---------- noLongerParticipate ----------

    @Test
    @DisplayName("noLongerParticipate retire l'utilisateur de la session et l'enregistre")
    void noLongerParticipate_shouldRemoveUserAndSave_whenUserParticipates() {
        // Given : l'utilisateur participe à la session
        session.getUsers().add(user);
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));

        sessionService.noLongerParticipate(1L, 10L);

        // Then : le service remplace la liste par une nouvelle liste filtrée, sans l'utilisateur
        assertFalse(session.getUsers().contains(user));
        verify(sessionRepository).save(session);
    }

    @Test
    @DisplayName("noLongerParticipate conserve les autres participants de la session")
    void noLongerParticipate_shouldKeepOtherParticipants() {
        // Given : deux participants, dont un seul se désinscrit
        User otherUser = new User()
                .setId(20L)
                .setEmail("jane.doe@test.com")
                .setFirstName("Jane")
                .setLastName("Doe")
                .setPassword("encoded-password")
                .setAdmin(false);
        session.getUsers().add(user);
        session.getUsers().add(otherUser);
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));

        // When : seul l'utilisateur 10 se désinscrit
        sessionService.noLongerParticipate(1L, 10L);

        // Then : le filtre a retiré l'utilisateur 10 mais gardé l'utilisateur 20
        assertEquals(List.of(otherUser), session.getUsers());
    }

    @Test
    @DisplayName("noLongerParticipate lève BadRequestException quand l'utilisateur ne participe pas")
    void noLongerParticipate_shouldThrowBadRequestException_whenUserDoesNotParticipate() {
        // Given : la liste des participants est vide
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));

        assertThrows(BadRequestException.class, () -> sessionService.noLongerParticipate(1L, 10L));
        verify(sessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("noLongerParticipate lève NotFoundException quand la session n'existe pas")
    void noLongerParticipate_shouldThrowNotFoundException_whenSessionDoesNotExist() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> sessionService.noLongerParticipate(99L, 10L));
        verify(sessionRepository, never()).save(any());
    }
}
