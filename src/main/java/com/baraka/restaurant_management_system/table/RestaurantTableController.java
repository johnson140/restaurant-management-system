package com.baraka.restaurant_management_system.table;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tables")
public class RestaurantTableController {

    private final RestaurantTableService restaurantTableService;

    public RestaurantTableController(RestaurantTableService restaurantTableService) {
        this.restaurantTableService = restaurantTableService;
    }

    @PostMapping
    public RestaurantTable createTable(@Valid @RequestBody Map<String, Integer> body) {
        return restaurantTableService.createTable(body.get("tableNumber"));
    }

    @GetMapping
    public List<RestaurantTable> getAllTables() {
        return restaurantTableService.getAllTables();
    }

    @GetMapping("/{id}")
    public RestaurantTable getTableById(@PathVariable int id) {
        return restaurantTableService.getTableById(id);
    }

    @GetMapping("/token/{token}")
    public RestaurantTable getTableByToken(@PathVariable String token) {
        return restaurantTableService.getTableByToken(token);
    }

    @PatchMapping("/{id}/status")
    public RestaurantTable updateStatus(@PathVariable int id,
                                        @RequestBody Map<String, String> body) {
        return restaurantTableService.updateStatus(id, body.get("status"));
    }

    @DeleteMapping("/{id}")
    public void deleteTable(@PathVariable int id) {
        restaurantTableService.deleteTable(id);
    }
}