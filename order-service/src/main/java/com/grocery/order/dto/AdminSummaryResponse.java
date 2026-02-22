package com.grocery.order.dto;

import java.math.BigDecimal;

public record AdminSummaryResponse(long itemsSold, BigDecimal revenue, long ordersInProcess) {
}
