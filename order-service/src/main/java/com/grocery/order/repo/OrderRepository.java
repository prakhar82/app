package com.grocery.order.repo;

import com.grocery.order.domain.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {
    Optional<OrderEntity> findByOrderRef(String orderRef);
    List<OrderEntity> findByUserEmailOrderByIdDesc(String userEmail);
    List<OrderEntity> findByStatusInOrderByIdDesc(Collection<String> statuses);

    @Query("select coalesce(sum(oi.quantity),0) from OrderEntity o join o.items oi where o.status in ('CONFIRMED','FULFILLING','SHIPPED','DELIVERED','COD_PENDING')")
    long totalItemsSold();

    @Query("select coalesce(sum(o.totalAmount),0) from OrderEntity o where o.status in ('CONFIRMED','FULFILLING','SHIPPED','DELIVERED','COD_PENDING')")
    java.math.BigDecimal totalRevenue();

    @Query("select count(o) from OrderEntity o where o.status in ('PENDING','COD_PENDING','CONFIRMED','FULFILLING','SHIPPED')")
    long totalInProcess();
}
