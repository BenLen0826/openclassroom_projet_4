package com.openclassrooms.starterjwt.mapper;

import com.openclassrooms.starterjwt.dto.SessionDto;
import com.openclassrooms.starterjwt.models.Session;
import com.openclassrooms.starterjwt.models.Teacher;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.services.TeacherService;
import com.openclassrooms.starterjwt.services.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests unitaires de SessionMapper (conversion Session <-> SessionDto).
 *
 * SessionMapper est une classe abstraite : MapStruct génère à la compilation la classe SessionMapperImpl
 * (dans target/generated-sources). C'est elle qu'on teste, car c'est elle que JaCoCo mesure.
 * Le mapper utilise TeacherService et UserService pour transformer des ids en objets : on les mocke.
 */
@ExtendWith(MockitoExtension.class)
class SessionMapperTest {

    @Mock
    private TeacherService teacherService;

    @Mock
    private UserService userService;

    // SessionMapperImpl n'a pas de constructeur avec paramètres :
    // Mockito injecte alors les mocks directement dans les champs teacherService et userService.
    @InjectMocks
    private SessionMapperImpl sessionMapper;

    private Teacher teacher;
    private User user1;
    private User user2;
    private Date date;

    @BeforeEach
    void setUp() {
        date = new Date();
        teacher = new Teacher().setId(5L).setFirstName("Margot").setLastName("DELAHAYE");
        user1 = new User().setId(10L).setEmail("john.doe@test.com").setFirstName("John")
                .setLastName("Doe").setPassword("pwd").setAdmin(false);
        user2 = new User().setId(20L).setEmail("jane.doe@test.com").setFirstName("Jane")
                .setLastName("Doe").setPassword("pwd").setAdmin(false);
    }

    private SessionDto buildDto(Long teacherId, List<Long> userIds) {
        SessionDto dto = new SessionDto();
        dto.setId(1L);
        dto.setName("Yoga du matin");
        dto.setDate(date);
        dto.setDescription("Séance douce");
        dto.setTeacher_id(teacherId);
        dto.setUsers(userIds);
        return dto;
    }

    private Session buildSession(Teacher sessionTeacher, List<User> users) {
        return new Session()
                .setId(1L)
                .setName("Yoga du matin")
                .setDate(date)
                .setDescription("Séance douce")
                .setTeacher(sessionTeacher)
                .setUsers(users);
    }

    // ---------- toEntity : SessionDto -> Session (création / modification d'une session) ----------

    @Test
    @DisplayName("toEntity copie les champs et récupère le professeur et les participants à partir de leurs ids")
    void toEntity_shouldMapFieldsAndLoadTeacherAndUsers() {
        when(teacherService.findById(5L)).thenReturn(teacher);
        when(userService.findById(10L)).thenReturn(user1);
        when(userService.findById(20L)).thenReturn(user2);

        Session session = sessionMapper.toEntity(buildDto(5L, List.of(10L, 20L)));

        assertEquals(1L, session.getId());
        assertEquals("Yoga du matin", session.getName());
        assertEquals(date, session.getDate());
        assertEquals("Séance douce", session.getDescription());
        assertSame(teacher, session.getTeacher());
        assertEquals(List.of(user1, user2), session.getUsers());
    }

    @Test
    @DisplayName("toEntity laisse le professeur à null et n'appelle pas TeacherService quand teacher_id est null")
    void toEntity_shouldSetTeacherToNull_whenTeacherIdIsNull() {
        Session session = sessionMapper.toEntity(buildDto(null, List.of()));

        assertNull(session.getTeacher());
        verify(teacherService, never()).findById(any());
    }

    @Test
    @DisplayName("toEntity renvoie une liste de participants vide quand la liste d'ids est null")
    void toEntity_shouldReturnEmptyUsers_whenUserIdsAreNull() {
        when(teacherService.findById(5L)).thenReturn(teacher);

        Session session = sessionMapper.toEntity(buildDto(5L, null));

        // Then : une liste null devient une liste vide
        assertTrue(session.getUsers().isEmpty());
    }

    // ---------- toDto : Session -> SessionDto (réponse envoyée au front) ----------

    @Test
    @DisplayName("toDto copie les champs, l'id du professeur et les ids des participants")
    void toDto_shouldMapFieldsTeacherIdAndUserIds() {
        SessionDto dto = sessionMapper.toDto(buildSession(teacher, new ArrayList<>(List.of(user1, user2))));

        assertEquals(1L, dto.getId());
        assertEquals("Yoga du matin", dto.getName());
        assertEquals(date, dto.getDate());
        assertEquals("Séance douce", dto.getDescription());
        assertEquals(5L, dto.getTeacher_id());
        assertEquals(List.of(10L, 20L), dto.getUsers());
    }

    @Test
    @DisplayName("toDto renvoie teacher_id null et une liste vide pour une session sans professeur ni participants")
    void toDto_shouldReturnNullTeacherIdAndEmptyUsers_whenSessionHasNoTeacherNorUsers() {
        SessionDto dto = sessionMapper.toDto(buildSession(null, null));

        assertNull(dto.getTeacher_id());
        assertTrue(dto.getUsers().isEmpty());
    }

    // ---------- listes et valeurs null ----------

    @Test
    @DisplayName("toDto convertit chaque session d'une liste")
    void toDtoList_shouldMapEachSession() {
        List<SessionDto> dtos = sessionMapper.toDto(List.of(buildSession(teacher, null), buildSession(null, null)));

        assertEquals(2, dtos.size());
        assertEquals(5L, dtos.get(0).getTeacher_id());
        assertNull(dtos.get(1).getTeacher_id());
    }

    @Test
    @DisplayName("toEntity convertit chaque DTO d'une liste")
    void toEntityList_shouldMapEachDto() {
        List<Session> sessions = sessionMapper.toEntity(List.of(buildDto(null, null), buildDto(null, null)));

        assertEquals(2, sessions.size());
        assertEquals("Yoga du matin", sessions.get(0).getName());
    }

    @Test
    @DisplayName("toEntity et toDto renvoient null quand on leur passe null")
    void mapping_shouldReturnNull_whenInputIsNull() {
        // Le cast (SessionDto) / (List<...>) indique à Java quelle version de la méthode appeler
        assertNull(sessionMapper.toEntity((SessionDto) null));
        assertNull(sessionMapper.toDto((Session) null));
        assertNull(sessionMapper.toEntity((List<SessionDto>) null));
        assertNull(sessionMapper.toDto((List<Session>) null));
    }
}
