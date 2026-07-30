package com.baraka.restaurant_management_system.table;

import com.baraka.restaurant_management_system.order.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.security.SecureRandom;
import java.util.List;

@Service
public class RestaurantTableServiceImpl implements RestaurantTableService {

    private final RestaurantTableRepository restaurantTableRepository;
    private final OrderRepository orderRepository;

    private static final SecureRandom RANDOM = new SecureRandom();

    // Orders in any of these statuses mean the table is still "in use" —
    // the customer hasn't paid/finished yet, so staff can't jump the
    // table back to AVAILABLE (or NEEDS_CLEANING) out from under them.
    private static final List<String> TERMINAL_STATUSES = List.of("PAID", "COMPLETED");

    public RestaurantTableServiceImpl(
            RestaurantTableRepository restaurantTableRepository,
            OrderRepository orderRepository
    ) {
        this.restaurantTableRepository = restaurantTableRepository;
        this.orderRepository = orderRepository;
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

        String newStatus = status.toUpperCase();

        // Neither AVAILABLE nor NEEDS_CLEANING can be set manually while
        // the table still has an order the customer hasn't paid for —
        // that decision belongs to the payment flow, not a manual click.
        if (newStatus.equals("AVAILABLE") || newStatus.equals("NEEDS_CLEANING")) {
            boolean hasActiveOrder = orderRepository.existsByTableNumberAndStatusNotIn(
                    table.getTableNumber(), TERMINAL_STATUSES
            );

            if (hasActiveOrder) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Cannot change this table's status — it still has an order in progress."
                );
            }
        }

        table.setStatus(newStatus);

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