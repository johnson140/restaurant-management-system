package com.baraka.restaurant_management_system.repository;

import com.baraka.restaurant_management_system.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {
}