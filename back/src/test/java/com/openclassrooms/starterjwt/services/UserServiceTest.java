package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.exception.NotFoundException;
import com.openclassrooms.starterjwt.exception.UnauthorizedException;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests unitaires de UserService.
 * Règle métier testée : un utilisateur ne peut supprimer que son propre compte.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        // Les setters de Lombok sont "chaînés" (@Accessors(chain = true)) : chaque setX renvoie l'objet.
        user = new User()
                .setId(1L)
                .setEmail("john.doe@test.com")
                .setFirstName("John")
                .setLastName("Doe")
                .setPassword("encoded-password")
                .setAdmin(false);
    }

    @Test
    @DisplayName("findById renvoie l'utilisateur quand il existe")
    void findById_shouldReturnUser_whenUserExists() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // When
        User result = userService.findById(1L);

        // Then
        assertSame(user, result);
    }

    @Test
    @DisplayName("findById lève NotFoundException quand l'utilisateur n'existe pas")
    void findById_shouldThrowNotFoundException_whenUserDoesNotExist() {
        // Given
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // When + Then
        assertThrows(NotFoundException.class, () -> userService.findById(99L));
    }

    @Test
    @DisplayName("delete supprime l'utilisateur quand l'utilisateur connecté supprime son propre compte")
    void delete_shouldDeleteUser_whenConnectedUserIsOwner() {
        // Given : l'utilisateur existe et l'email connecté est le sien
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // When
        userService.delete(1L, "john.doe@test.com");

        // Then : la méthode ne renvoie rien (void), on vérifie donc l'effet attendu :
        // le repository a bien reçu l'ordre de supprimer CET utilisateur.
        verify(userRepository).delete(user);
    }

    @Test
    @DisplayName("delete lève UnauthorizedException et ne supprime rien quand le compte appartient à un autre utilisateur")
    void delete_shouldThrowUnauthorizedException_whenConnectedUserIsNotOwner() {
        // Given : l'utilisateur existe mais l'email connecté est celui de quelqu'un d'autre
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // When + Then
        assertThrows(UnauthorizedException.class, () -> userService.delete(1L, "other.user@test.com"));

        // never() : vérifie que delete n'a JAMAIS été appelé, quel que soit l'argument (any()).
        verify(userRepository, never()).delete(any());
    }

    @Test
    @DisplayName("delete lève NotFoundException et ne supprime rien quand l'utilisateur n'existe pas")
    void delete_shouldThrowNotFoundException_whenUserDoesNotExist() {
        // Given
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // When + Then
        assertThrows(NotFoundException.class, () -> userService.delete(99L, "john.doe@test.com"));
        verify(userRepository, never()).delete(any());
    }
}
