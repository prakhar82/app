package com.grocery.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record ReserveRequest(@NotBlank String orderRef, @Valid List<ReservationItem> items) {
}
