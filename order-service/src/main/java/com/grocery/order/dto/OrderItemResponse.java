package com.grocery.order.dto;

import java.math.BigDecimal;

public record OrderItemResponse(String sku, String itemName, int quantity, BigDecimal unitPrice) {
}
