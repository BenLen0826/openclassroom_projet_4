package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.exception.BadRequestException;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.payload.request.LoginRequest;
import com.openclassrooms.starterjwt.payload.request.SignupRequest;
import com.openclassrooms.starterjwt.payload.response.JwtResponse;
import com.openclassrooms.starterjwt.repository.UserRepository;
import com.openclassrooms.starterjwt.security.jwt.JwtUtils;
import com.openclassrooms.starterjwt.security.services.UserDetailsImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

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
 * Tests unitaires d'AuthService (connexion et inscription).
 * Toutes les briques de Spring Security sont mockées : on ne vérifie pas un vrai mot de passe ici,
 * on vérifie ce que fait le service selon la réponse de l'AuthenticationManager.
 * (La vraie vérification du mot de passe sera testée dans les tests d'intégration.)
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private UserRepository userRepository;

    // Authentication est une interface de Spring Security : on la mocke aussi,
    // pour contrôler ce que renvoie getPrincipal() (l'utilisateur connecté).
    @Mock
    private Authentication authentication;

    @InjectMocks
    private AuthService authService;

    private LoginRequest loginRequest;
    private UserDetailsImpl userDetails;

    @BeforeEach
    void setUp() {
        loginRequest = new LoginRequest();
        loginRequest.setEmail("john.doe@test.com");
        loginRequest.setPassword("password123");

        // Objet que Spring Security place dans l'Authentication après une connexion réussie
        userDetails = UserDetailsImpl.builder()
                .id(1L)
                .username("john.doe@test.com")
                .firstName("John")
                .lastName("Doe")
                .password("encoded-password")
                .build();
    }

    // login() écrit dans SecurityContextHolder, qui est partagé (static) entre les tests :
    // on le vide après chaque test pour que les tests restent indépendants.
    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    /** Prépare une connexion réussie : utilisé par les tests de login qui doivent aboutir. */
    private void givenAuthenticationSucceeds() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(jwtUtils.generateJwtToken(authentication)).thenReturn("jwt-token");
    }

    private User userWithAdmin(boolean admin) {
        return new User()
                .setId(1L)
                .setEmail("john.doe@test.com")
                .setFirstName("John")
                .setLastName("Doe")
                .setPassword("encoded-password")
                .setAdmin(admin);
    }

    // ---------- login ----------

    @Test
    @DisplayName("login renvoie un JwtResponse complet avec admin = true pour un administrateur")
    void login_shouldReturnJwtResponseWithAdminTrue_whenUserIsAdmin() {
        // Given
        givenAuthenticationSucceeds();
        when(userRepository.findByEmail("john.doe@test.com")).thenReturn(Optional.of(userWithAdmin(true)));

        // When
        JwtResponse response = authService.login(loginRequest);

        // Then : la réponse contient le token et les informations de l'utilisateur
        assertEquals("jwt-token", response.getToken());
        assertEquals("Bearer", response.getType());
        assertEquals(1L, response.getId());
        assertEquals("john.doe@test.com", response.getUsername());
        assertEquals("John", response.getFirstName());
        assertEquals("Doe", response.getLastName());
        assertTrue(response.getAdmin());

        // L'AuthenticationManager a reçu l'email et le mot de passe saisis
        ArgumentCaptor<UsernamePasswordAuthenticationToken> captor =
                ArgumentCaptor.forClass(UsernamePasswordAuthenticationToken.class);
        verify(authenticationManager).authenticate(captor.capture());
        assertEquals("john.doe@test.com", captor.getValue().getPrincipal());
        assertEquals("password123", captor.getValue().getCredentials());

        // L'utilisateur est enregistré comme connecté dans le contexte de sécurité
        assertSame(authentication, SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    @DisplayName("login renvoie admin = false pour un utilisateur non administrateur")
    void login_shouldReturnAdminFalse_whenUserIsNotAdmin() {
        // Given
        givenAuthenticationSucceeds();
        when(userRepository.findByEmail("john.doe@test.com")).thenReturn(Optional.of(userWithAdmin(false)));

        // When
        JwtResponse response = authService.login(loginRequest);

        // Then
        assertFalse(response.getAdmin());
    }

    @Test
    @DisplayName("login renvoie admin = false quand l'utilisateur n'est pas retrouvé en base")
    void login_shouldReturnAdminFalse_whenUserNotFoundInRepository() {
        // Given : cas improbable mais prévu par le code (branche orElse(false))
        givenAuthenticationSucceeds();
        when(userRepository.findByEmail("john.doe@test.com")).thenReturn(Optional.empty());

        // When
        JwtResponse response = authService.login(loginRequest);

        // Then
        assertFalse(response.getAdmin());
    }

    @Test
    @DisplayName("login laisse remonter BadCredentialsException et ne génère pas de token si les identifiants sont faux")
    void login_shouldThrowBadCredentialsException_whenCredentialsAreInvalid() {
        // Given : thenThrow fait lever une exception par le mock au lieu de renvoyer une valeur
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        // When + Then : Spring Security transformera cette exception en réponse 401
        assertThrows(BadCredentialsException.class, () -> authService.login(loginRequest));
        verify(jwtUtils, never()).generateJwtToken(any());
    }

    // ---------- register ----------

    @Test
    @DisplayName("register enregistre un nouvel utilisateur non admin avec le mot de passe encodé")
    void register_shouldSaveUserWithEncodedPassword_whenEmailIsAvailable() {
        // Given
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setEmail("jane.doe@test.com");
        signupRequest.setFirstName("Jane");
        signupRequest.setLastName("Doe");
        signupRequest.setPassword("password123");
        when(userRepository.existsByEmail("jane.doe@test.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded-password");

        // When
        authService.register(signupRequest);

        // Then : on capture l'utilisateur passé à save() pour vérifier chacun de ses champs
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User savedUser = captor.getValue();
        assertEquals("jane.doe@test.com", savedUser.getEmail());
        assertEquals("Jane", savedUser.getFirstName());
        assertEquals("Doe", savedUser.getLastName());
        // Le mot de passe n'est jamais stocké en clair
        assertEquals("encoded-password", savedUser.getPassword());
        // Un compte créé par inscription n'est jamais administrateur
        assertFalse(savedUser.isAdmin());
    }

    @Test
    @DisplayName("register lève BadRequestException et n'enregistre rien quand l'email est déjà utilisé")
    void register_shouldThrowBadRequestException_whenEmailIsAlreadyTaken() {
        // Given
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setEmail("john.doe@test.com");
        signupRequest.setFirstName("John");
        signupRequest.setLastName("Doe");
        signupRequest.setPassword("password123");
        when(userRepository.existsByEmail("john.doe@test.com")).thenReturn(true);

        // When + Then : on récupère l'exception pour vérifier aussi son message (renvoyé au front)
        BadRequestException exception =
                assertThrows(BadRequestException.class, () -> authService.register(signupRequest));
        assertEquals("Error: Email is already taken!", exception.getMessage());
        verify(userRepository, never()).save(any());
    }
}
