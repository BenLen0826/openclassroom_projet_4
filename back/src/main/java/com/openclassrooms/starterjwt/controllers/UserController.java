package com.openclassrooms.starterjwt.controllers;

import com.openclassrooms.starterjwt.mapper.UserMapper;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
public class UserController {
    private final UserMapper userMapper;
    private final UserService userService;


    public UserController(UserService userService,
                          UserMapper userMapper) {
        this.userMapper = userMapper;
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> findById(@PathVariable("id") Long id) {
        User user = this.userService.findById(id);

        return ResponseEntity.ok().body(this.userMapper.toDto(user));
    }

    // Précédemment nommée "save" alors qu'elle supprime l'utilisateur.
    @DeleteMapping("{id}")
    public ResponseEntity<?> delete(@PathVariable("id") Long id, @AuthenticationPrincipal UserDetails userDetails) {
        this.userService.delete(id, userDetails.getUsername());

        return ResponseEntity.ok().build();
    }
}
