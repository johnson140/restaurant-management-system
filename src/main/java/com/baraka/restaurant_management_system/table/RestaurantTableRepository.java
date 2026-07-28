package com.baraka.restaurant_management_system.table;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Integer> {

    Optional<RestaurantTable> findByToken(String token);

    boolean existsByTableNumber(int tableNumber);

    boolean existsByToken(String token);
}