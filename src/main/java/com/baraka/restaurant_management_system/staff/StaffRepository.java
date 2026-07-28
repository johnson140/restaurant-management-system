package com.baraka.restaurant_management_system.staff;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StaffRepository extends JpaRepository<Staff, Integer> {

    Optional<Staff> findByUsername(String username);

    boolean existsByUsername(String username);

    List<Staff> findByRole(String role);
}