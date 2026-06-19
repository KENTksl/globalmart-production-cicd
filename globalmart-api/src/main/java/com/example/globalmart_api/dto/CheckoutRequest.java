package com.example.globalmart_api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CheckoutRequest {
    private Long userId;

    @NotBlank
    private String customerName;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String phone;

    @NotBlank
    private String address;

    private String notes;

    @NotEmpty
    private List<CheckoutItemRequest> items;

    @Data
    public static class CheckoutItemRequest {
        @NotNull
        private Long productId;

        @Min(1)
        private int quantity;
    }
}
