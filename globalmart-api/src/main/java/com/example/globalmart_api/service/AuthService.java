package com.example.globalmart_api.service;

import com.example.globalmart_api.config.JwtUtil;
import com.example.globalmart_api.dto.AuthResponse;
import com.example.globalmart_api.dto.LoginRequest;
import com.example.globalmart_api.dto.RegisterRequest;
import com.example.globalmart_api.model.User;
import com.example.globalmart_api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AtomicLong userIdCounter = new AtomicLong(1);

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setNumericId(userIdCounter.getAndIncrement());
        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername(), user.getId());
        AuthResponse.UserDto userDto = new AuthResponse.UserDto(user.getNumericId(), user.getUsername(), user.getEmail());
        return new AuthResponse(token, userDto);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getId());
        AuthResponse.UserDto userDto = new AuthResponse.UserDto(user.getNumericId(), user.getUsername(), user.getEmail());
        return new AuthResponse(token, userDto);
    }
}
