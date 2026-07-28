package com.baraka.restaurant_management_system.order;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public Order createOrder(@Valid @RequestBody OrderRequest request) {
        return orderService.createOrder(request);
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }

    @GetMapping("/{id}")
    public Order getOrderById(@PathVariable int id) {
        return orderService.getOrderById(id);
    }

    @GetMapping("/table/{tableNumber}")
    public Order getLatestOrderForTable(@PathVariable int tableNumber) {
        return orderService.getLatestOrderForTable(tableNumber);
    }

    @GetMapping("/payments/pending")
    public List<Order> getPendingPayments() {
        return orderService.getPendingPayments();
    }

    @PatchMapping("/{id}/status")
    public Order updateStatus(
            @PathVariable int id,
            @RequestBody Map<String, String> body
    ) {
        return orderService.updateOrderStatus(
                id,
                body.get("status")
        );
    }
}