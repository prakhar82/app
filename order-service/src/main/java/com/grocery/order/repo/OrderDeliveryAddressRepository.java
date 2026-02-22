package com.grocery.order.repo;

import com.grocery.order.domain.OrderDeliveryAddressEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderDeliveryAddressRepository extends JpaRepository<OrderDeliveryAddressEntity, Long> {
}
