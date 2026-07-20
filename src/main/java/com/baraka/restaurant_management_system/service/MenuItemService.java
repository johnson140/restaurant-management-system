package com.baraka.restaurant_management_system.service;

import com.baraka.restaurant_management_system.model.MenuItem;
import java.util.List;

public interface MenuItemService {
    MenuItem createMenuItem(MenuItem menuItem);
    List<MenuItem> getAllMenuItems();
    MenuItem getMenuItemById(int id);
    MenuItem updateMenuItem(int id, MenuItem menuItem);
    void deleteMenuItem(int id);
}