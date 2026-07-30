package com.baraka.restaurant_management_system.order;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Integer> {

    List<Order> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    Optional<Order> findFirstByTableNumberOrderByCreatedAtDesc(int tableNumber);

    List<Order> findByStatusOrderByCreatedAtAsc(String status);

    List<Order> findByRatingIsNotNullOrderByIdDesc();

    boolean existsByTableNumberAndStatusNotIn(int tableNumber, java.util.List<String> statuses);

}