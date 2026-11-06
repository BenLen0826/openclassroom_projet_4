package com.openclassrooms.starterjwt.mapper;

import com.openclassrooms.starterjwt.dto.UserDto;
import com.openclassrooms.starterjwt.models.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Tests unitaires de UserMapper (conversion User <-> UserDto).
 * Même principe que TeacherMapperTest : on teste la classe UserMapperImpl générée par MapStruct.
 */
class UserMapperTest {

    private final UserMapper userMapper = new UserMapperImpl();

    private final LocalDateTime createdAt = LocalDateTime.of(2026, 1, 1, 10, 0);
    private final LocalDateTime updatedAt = LocalDateTime.of(2026, 1, 2, 10, 0);

    private User buildUser() {
        return new User().setId(1L).setEmail("yoga@studio.com").setFirstName("Admin").setLastName("ADMIN")
                .setPassword("encoded-password").setAdmin(true)
                .setCreatedAt(createdAt).setUpdatedAt(updatedAt);
    }

    private UserDto buildDto() {
        return new UserDto(1L, "yoga@studio.com", "ADMIN", "Admin", true, "encoded-password", createdAt, updatedAt);
    }

    @Test
    @DisplayName("toDto copie tous les champs de l'utilisateur")
    void toDto_shouldMapAllFields() {
        UserDto dto = userMapper.toDto(buildUser());

        assertEquals(1L, dto.getId());
        assertEquals("yoga@studio.com", dto.getEmail());
        assertEquals("Admin", dto.getFirstName());
        assertEquals("ADMIN", dto.getLastName());
        assertTrue(dto.isAdmin());
        // Le mot de passe est copié dans le DTO, mais @JsonIgnore l'empêche d'apparaître dans le JSON
        // (vérifié dans les tests d'intégration de UserController).
        assertEquals("encoded-password", dto.getPassword());
        assertEquals(createdAt, dto.getCreatedAt());
        assertEquals(updatedAt, dto.getUpdatedAt());
    }

    @Test
    @DisplayName("toEntity copie tous les champs du DTO")
    void toEntity_shouldMapAllFields() {
        User user = userMapper.toEntity(buildDto());

        assertEquals(1L, user.getId());
        assertEquals("yoga@studio.com", user.getEmail());
        assertEquals("Admin", user.getFirstName());
        assertEquals("ADMIN", user.getLastName());
        assertTrue(user.isAdmin());
        assertEquals("encoded-password", user.getPassword());
        assertEquals(createdAt, user.getCreatedAt());
        assertEquals(updatedAt, user.getUpdatedAt());
    }

    @Test
    @DisplayName("toDto et toEntity convertissent chaque élément d'une liste")
    void listMapping_shouldMapEachElement() {
        List<UserDto> dtos = userMapper.toDto(List.of(buildUser(), buildUser()));
        List<User> users = userMapper.toEntity(List.of(buildDto()));

        assertEquals(2, dtos.size());
        assertEquals("yoga@studio.com", dtos.get(0).getEmail());
        assertEquals(1, users.size());
        assertEquals("yoga@studio.com", users.get(0).getEmail());
    }

    @Test
    @DisplayName("toDto et toEntity renvoient null quand on leur passe null")
    void mapping_shouldReturnNull_whenInputIsNull() {
        assertNull(userMapper.toDto((User) null));
        assertNull(userMapper.toEntity((UserDto) null));
        assertNull(userMapper.toDto((List<User>) null));
        assertNull(userMapper.toEntity((List<UserDto>) null));
    }
}
