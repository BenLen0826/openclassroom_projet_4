package com.openclassrooms.starterjwt.security.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Tests unitaires de UserDetailsImpl, l'objet "utilisateur connecté" utilisé par Spring Security.
 * Seules les méthodes écrites à la main sont testées (equals, getAuthorities, état du compte) :
 * les getters générés par Lombok sont ignorés par JaCoCo (voir lombok.config).
 */
class UserDetailsImplTest {

    private UserDetailsImpl userDetails;

    @BeforeEach
    void setUp() {
        userDetails = buildUserDetails(1L);
    }

    private UserDetailsImpl buildUserDetails(Long id) {
        return UserDetailsImpl.builder()
                .id(id)
                .username("john.doe@test.com")
                .firstName("John")
                .lastName("Doe")
                .admin(false)
                .password("encoded-password")
                .build();
    }

    // ---------- equals : deux utilisateurs connectés sont égaux s'ils ont le même id ----------
    // On appelle equals() directement : chaque test vise une des conditions (if) de la méthode.

    @Test
    @DisplayName("equals renvoie true pour le même objet")
    void equals_shouldReturnTrue_whenSameInstance() {
        assertTrue(userDetails.equals(userDetails));
    }

    @Test
    @DisplayName("equals renvoie true pour deux objets ayant le même id")
    void equals_shouldReturnTrue_whenSameId() {
        assertTrue(userDetails.equals(buildUserDetails(1L)));
    }

    @Test
    @DisplayName("equals renvoie false pour deux objets ayant des id différents")
    void equals_shouldReturnFalse_whenDifferentId() {
        assertFalse(userDetails.equals(buildUserDetails(2L)));
    }

    @Test
    @DisplayName("equals renvoie false quand on compare avec null")
    void equals_shouldReturnFalse_whenComparedWithNull() {
        assertFalse(userDetails.equals(null));
    }

    @Test
    @DisplayName("equals renvoie false quand on compare avec un objet d'une autre classe")
    void equals_shouldReturnFalse_whenComparedWithOtherClass() {
        assertFalse(userDetails.equals("john.doe@test.com"));
    }

    // ---------- droits et état du compte ----------

    @Test
    @DisplayName("getAuthorities renvoie une liste de droits vide")
    void getAuthorities_shouldReturnEmptyCollection() {
        // L'application ne gère pas de rôles Spring Security (le statut admin est un simple booléen)
        assertTrue(userDetails.getAuthorities().isEmpty());
    }

    @Test
    @DisplayName("le compte est toujours considéré comme actif (non expiré, non verrouillé, activé)")
    void accountStatus_shouldAlwaysBeActive() {
        assertTrue(userDetails.isAccountNonExpired());
        assertTrue(userDetails.isAccountNonLocked());
        assertTrue(userDetails.isCredentialsNonExpired());
        assertTrue(userDetails.isEnabled());
    }
}
