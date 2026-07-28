package com.baraka.restaurant_management_system.menuitem;

import java.util.List;

public interface MenuItemService {
    MenuItem createMenuItem(MenuItem menuItem);
    List<MenuItem> getAllMenuItems();
    MenuItem getMenuItemById(int id);
    MenuItem updateMenuItem(int id, MenuItem menuItem);
    void deleteMenuItem(int id);
}