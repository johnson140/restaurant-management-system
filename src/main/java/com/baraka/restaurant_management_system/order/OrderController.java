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

    // IMPORTANT: this must be declared BEFORE "/{id}" below, otherwise
    // Spring will try to match "reviews" as an int path variable for
    // getOrderById and throw a 400.
    @GetMapping("/reviews")
    public List<Order> getReviews() {
        return orderService.getReviewedOrders();
    }

    @GetMapping("/{id}")
    public Order getOrderById(@PathVariable("id") int id) {
        return orderService.getOrderById(id);
    }

    @GetMapping("/table/{tableNumber}")
    public Order getLatestOrderForTable(@PathVariable("tableNumber") int tableNumber) {
        return orderService.getLatestOrderForTable(tableNumber);
    }

    @GetMapping("/payments/pending")
    public List<Order> getPendingPayments() {
        return orderService.getPendingPayments();
    }

    @PatchMapping("/{id}/status")
    public Order updateStatus(
            @PathVariable("id") int id,
            @RequestBody Map<String, String> body
    ) {
        return orderService.updateOrderStatus(
                id,
                body.get("status"),
                body.get("paymentMethod")
        );
    }

    @PostMapping("/{id}/review")
    public Order submitReview(@PathVariable("id") int id, @RequestBody ReviewRequest request) {
        return orderService.submitReview(id, request.getRating(), request.getComment());
    }

    @PatchMapping("/{id}/review/read")
    public Order markReviewRead(@PathVariable("id") int id) {
        return orderService.markReviewRead(id);
    }
}