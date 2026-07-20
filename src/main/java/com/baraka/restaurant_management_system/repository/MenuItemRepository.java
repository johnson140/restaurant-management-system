package com.baraka.restaurant_management_system.repository;

import com.baraka.restaurant_management_system.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuItemRepository extends JpaRepository<MenuItem,Integer> {

}
