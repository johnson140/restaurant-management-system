package com.baraka.restaurant_management_system.menuitem;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MenuItemServiceImpl implements MenuItemService {

    private final MenuItemRepository menuItemRepository;

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
        return menuItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu item not found."));
    }

    @Override
    public MenuItem updateMenuItem(int id, MenuItem updatedMenuItem) {

        MenuItem existingMenuItem = menuItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu item not found."));

        existingMenuItem.setName(updatedMenuItem.getName());
        existingMenuItem.setPrice(updatedMenuItem.getPrice());
        existingMenuItem.setAvailable(updatedMenuItem.isAvailable());
        existingMenuItem.setCategory(updatedMenuItem.getCategory());
        existingMenuItem.setVeg(updatedMenuItem.getVeg());

        return menuItemRepository.save(existingMenuItem);
    }

    @Override
    public void deleteMenuItem(int id) {

        if (!menuItemRepository.existsById(id)) {
            throw new RuntimeException("Menu item not found.");
        }

        menuItemRepository.deleteById(id);
    }

}