package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.exception.NotFoundException;
import com.openclassrooms.starterjwt.models.Teacher;
import com.openclassrooms.starterjwt.repository.TeacherRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests unitaires de TeacherService.
 * Le repository est remplacé par un mock : on teste uniquement la logique du service,
 * sans démarrer Spring ni utiliser de base de données.
 */
// Active Mockito dans JUnit 5 : crée les champs @Mock et les injecte dans le champ @InjectMocks.
@ExtendWith(MockitoExtension.class)
class TeacherServiceTest {

    // Faux repository : par défaut, toutes ses méthodes renvoient une valeur "vide" (null, Optional.empty(), liste vide...).
    // Avec when(...).thenReturn(...), on choisit ce qu'il renvoie dans chaque test.
    @Mock
    private TeacherRepository teacherRepository;

    // Vrai service, construit par Mockito avec le faux repository passé dans son constructeur.
    @InjectMocks
    private TeacherService teacherService;

    private Teacher teacher;

    // Exécuté avant chaque test : chaque test repart d'un professeur neuf (les tests restent indépendants).
    @BeforeEach
    void setUp() {
        teacher = new Teacher()
                .setId(1L)
                .setFirstName("Margot")
                .setLastName("DELAHAYE");
    }

    @Test
    @DisplayName("findAll renvoie la liste des professeurs fournie par le repository")
    void findAll_shouldReturnAllTeachers() {
        // Given : le repository contient deux professeurs
        Teacher otherTeacher = new Teacher().setId(2L).setFirstName("Hélène").setLastName("THIERCELIN");
        List<Teacher> teachers = List.of(teacher, otherTeacher);
        when(teacherRepository.findAll()).thenReturn(teachers);

        // When : on appelle la méthode testée
        List<Teacher> result = teacherService.findAll();

        // Then : le service renvoie exactement la liste du repository, et l'a bien interrogé
        assertEquals(teachers, result);
        verify(teacherRepository).findAll();
    }

    @Test
    @DisplayName("findById renvoie le professeur quand il existe")
    void findById_shouldReturnTeacher_whenTeacherExists() {
        // Given : le repository trouve le professeur d'id 1
        when(teacherRepository.findById(1L)).thenReturn(Optional.of(teacher));

        // When
        Teacher result = teacherService.findById(1L);

        // Then : assertSame vérifie que c'est le même objet (pas seulement un objet égal)
        assertSame(teacher, result);
    }

    @Test
    @DisplayName("findById lève NotFoundException quand le professeur n'existe pas")
    void findById_shouldThrowNotFoundException_whenTeacherDoesNotExist() {
        // Given : le repository ne trouve rien pour l'id 99
        when(teacherRepository.findById(99L)).thenReturn(Optional.empty());

        // When + Then : assertThrows exécute le code (lambda) et vérifie qu'il lève bien cette exception.
        // C'est cette exception qui sera traduite en 404 par le GlobalExceptionHandler.
        assertThrows(NotFoundException.class, () -> teacherService.findById(99L));
    }
}
