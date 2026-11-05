package com.openclassrooms.starterjwt.mapper;

import com.openclassrooms.starterjwt.dto.TeacherDto;
import com.openclassrooms.starterjwt.models.Teacher;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Tests unitaires de TeacherMapper (conversion Teacher <-> TeacherDto).
 * TeacherMapper est une interface : MapStruct génère TeacherMapperImpl, sans dépendance,
 * qu'on peut donc créer simplement avec "new" (ni Spring ni Mockito nécessaires).
 *
 * Pourquoi tester ce code généré ? JaCoCo le mesure, et toEntity n'est jamais appelée par l'application :
 * aucun test d'intégration ne pourrait la couvrir.
 */
class TeacherMapperTest {

    private final TeacherMapper teacherMapper = new TeacherMapperImpl();

    private final LocalDateTime createdAt = LocalDateTime.of(2026, 1, 1, 10, 0);
    private final LocalDateTime updatedAt = LocalDateTime.of(2026, 1, 2, 10, 0);

    private Teacher buildTeacher() {
        return new Teacher().setId(5L).setFirstName("Margot").setLastName("DELAHAYE")
                .setCreatedAt(createdAt).setUpdatedAt(updatedAt);
    }

    private TeacherDto buildDto() {
        return new TeacherDto(5L, "DELAHAYE", "Margot", createdAt, updatedAt);
    }

    @Test
    @DisplayName("toDto copie tous les champs du professeur")
    void toDto_shouldMapAllFields() {
        // When
        TeacherDto dto = teacherMapper.toDto(buildTeacher());

        // Then
        assertEquals(5L, dto.getId());
        assertEquals("Margot", dto.getFirstName());
        assertEquals("DELAHAYE", dto.getLastName());
        assertEquals(createdAt, dto.getCreatedAt());
        assertEquals(updatedAt, dto.getUpdatedAt());
    }

    @Test
    @DisplayName("toEntity copie tous les champs du DTO")
    void toEntity_shouldMapAllFields() {
        // When
        Teacher teacher = teacherMapper.toEntity(buildDto());

        // Then
        assertEquals(5L, teacher.getId());
        assertEquals("Margot", teacher.getFirstName());
        assertEquals("DELAHAYE", teacher.getLastName());
        assertEquals(createdAt, teacher.getCreatedAt());
        assertEquals(updatedAt, teacher.getUpdatedAt());
    }

    @Test
    @DisplayName("toDto et toEntity convertissent chaque élément d'une liste")
    void listMapping_shouldMapEachElement() {
        // When
        List<TeacherDto> dtos = teacherMapper.toDto(List.of(buildTeacher(), buildTeacher()));
        List<Teacher> teachers = teacherMapper.toEntity(List.of(buildDto()));

        // Then
        assertEquals(2, dtos.size());
        assertEquals("Margot", dtos.get(0).getFirstName());
        assertEquals(1, teachers.size());
        assertEquals("Margot", teachers.get(0).getFirstName());
    }

    @Test
    @DisplayName("toDto et toEntity renvoient null quand on leur passe null")
    void mapping_shouldReturnNull_whenInputIsNull() {
        assertNull(teacherMapper.toDto((Teacher) null));
        assertNull(teacherMapper.toEntity((TeacherDto) null));
        assertNull(teacherMapper.toDto((List<Teacher>) null));
        assertNull(teacherMapper.toEntity((List<TeacherDto>) null));
    }
}
