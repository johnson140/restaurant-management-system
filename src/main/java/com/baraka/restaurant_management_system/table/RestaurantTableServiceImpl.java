package com.baraka.restaurant_management_system.table;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.List;

@Service
public class RestaurantTableServiceImpl implements RestaurantTableService {

    private final RestaurantTableRepository restaurantTableRepository;

    private static final SecureRandom RANDOM = new SecureRandom();

    public RestaurantTableServiceImpl(RestaurantTableRepository restaurantTableRepository) {
        this.restaurantTableRepository = restaurantTableRepository;
    }

    @Override
    public RestaurantTable createTable(int tableNumber) {

        if (restaurantTableRepository.existsByTableNumber(tableNumber)) {
            throw new RuntimeException("Table number already exists.");
        }

        String token;

        do {
            token = generateToken();
        } while (restaurantTableRepository.existsByToken(token));

        RestaurantTable table = new RestaurantTable(tableNumber, token);

        return restaurantTableRepository.save(table);
    }

    @Override
    public List<RestaurantTable> getAllTables() {
        return restaurantTableRepository.findAll();
    }

    @Override
    public RestaurantTable getTableById(int id) {
        return restaurantTableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Table not found."));
    }

    @Override
    public RestaurantTable getTableByToken(String token) {
        return restaurantTableRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Table not found."));
    }

    @Override
    public RestaurantTable updateStatus(int id, String status) {

        RestaurantTable table = restaurantTableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Table not found."));

        table.setStatus(status.toUpperCase());

        return restaurantTableRepository.save(table);
    }

    @Override
    public void deleteTable(int id) {

        if (!restaurantTableRepository.existsById(id)) {
            throw new RuntimeException("Table not found.");
        }

        restaurantTableRepository.deleteById(id);
    }

    private String generateToken() {
        return "TBL_" +
                (100000 + RANDOM.nextInt(900000)) +
                "_" +
                (10000 + RANDOM.nextInt(90000));
    }
}