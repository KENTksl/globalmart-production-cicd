package com.example.globalmart_api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private UserDto user;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDto {
        private long id;
        private String username;
        private String email;
    }
}
