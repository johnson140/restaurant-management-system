package com.baraka.restaurant_management_system.service;

import com.baraka.restaurant_management_system.model.MenuItem;
import com.baraka.restaurant_management_system.repository.MenuItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MenuItemServiceImpl implements MenuItemService {

    private final MenuItemRepository menuItemRepository;

    @Autowired
    public MenuItemServiceImpl(MenuItemRepository menuItemRepository) {
        this.menuItemRepository = menuItemRepository;
    }

    @Override
    public MenuItem createMenuItem(MenuItem menuItem) {
        return menuItemRepository.save(menuItem);
    }

    @Override
    public List<MenuItem> getAllMenuItems() {
        return menuItemRepository.findAll();
    }

    @Override
    public MenuItem getMenuItemById(int id) {
        return menuItemRepository.findById(id).orElse(null);
    }

    @Override
    public MenuItem updateMenuItem(int id, MenuItem menuItem) {menuItem.setId(id);
        return menuItemRepository.save(menuItem);
    }

    @Override
    public void deleteMenuItem(int id) {
        menuItemRepository.deleteById(id);
    }
}