package com.baraka.restaurant_management_system.table;

import java.util.List;

public interface RestaurantTableService {
    RestaurantTable createTable(int tableNumber);
    List<RestaurantTable> getAllTables();
    RestaurantTable getTableById(int id);
    RestaurantTable getTableByToken(String token);
    RestaurantTable updateStatus(int id, String status);
    void deleteTable(int id);
}
