package com.example.globalmart_api.controller;

import com.example.globalmart_api.dto.AuthResponse;
import com.example.globalmart_api.dto.LoginRequest;
import com.example.globalmart_api.dto.RegisterRequest;
import com.example.globalmart_api.dto.UpdateUserRequest;
import com.example.globalmart_api.model.User;
import com.example.globalmart_api.repository.UserRepository;
import com.example.globalmart_api.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse.UserDto> getCurrentUser() {
        String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        AuthResponse.UserDto userDto = new AuthResponse.UserDto(user.getId(), user.getUsername(), user.getEmail());
        return ResponseEntity.ok(userDto);
    }

    @PutMapping("/me")
    public ResponseEntity<AuthResponse.UserDto> updateCurrentUser(@Valid @RequestBody UpdateUserRequest request) {
        String currentUsername = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                return ResponseEntity.badRequest().build();
            }
            user.setUsername(request.getUsername());
        }

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        user = userRepository.save(user);
        AuthResponse.UserDto userDto = new AuthResponse.UserDto(user.getId(), user.getUsername(), user.getEmail());
        return ResponseEntity.ok(userDto);
    }
}
