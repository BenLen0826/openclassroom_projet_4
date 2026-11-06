package com.openclassrooms.starterjwt.security.services;

import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

/**
 * Tests unitaires de UserDetailsServiceImpl.
 * Spring Security appelle loadUserByUsername pour retrouver l'utilisateur à partir de son email
 * (à la connexion, et à chaque requête qui contient un token JWT).
 */
@ExtendWith(MockitoExtension.class)
class UserDetailsServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserDetailsServiceImpl userDetailsService;

    @Test
    @DisplayName("loadUserByUsername renvoie les informations de l'utilisateur quand l'email existe")
    void loadUserByUsername_shouldReturnUserDetails_whenEmailExists() {
        User user = new User()
                .setId(1L)
                .setEmail("john.doe@test.com")
                .setFirstName("John")
                .setLastName("Doe")
                .setPassword("encoded-password")
                .setAdmin(false);
        when(userRepository.findByEmail("john.doe@test.com")).thenReturn(Optional.of(user));

        var result = userDetailsService.loadUserByUsername("john.doe@test.com");

        // Then : l'objet renvoyé est un UserDetailsImpl rempli avec les données de l'utilisateur.
        UserDetailsImpl userDetails = assertInstanceOf(UserDetailsImpl.class, result);
        assertEquals(1L, userDetails.getId());
        assertEquals("john.doe@test.com", userDetails.getUsername());
        assertEquals("John", userDetails.getFirstName());
        assertEquals("Doe", userDetails.getLastName());
        assertEquals("encoded-password", userDetails.getPassword());
    }

    @Test
    @DisplayName("loadUserByUsername lève UsernameNotFoundException quand l'email est inconnu")
    void loadUserByUsername_shouldThrowUsernameNotFoundException_whenEmailDoesNotExist() {
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        // When + Then : c'est l'exception attendue par Spring Security pour un utilisateur inconnu
        assertThrows(UsernameNotFoundException.class,
                () -> userDetailsService.loadUserByUsername("unknown@test.com"));
    }
}
