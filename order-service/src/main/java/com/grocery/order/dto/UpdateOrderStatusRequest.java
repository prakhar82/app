package com.grocery.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateOrderStatusRequest(@NotBlank String status,
                                       @Size(max = 500) String comment) {
}
