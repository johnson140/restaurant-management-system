package com.baraka.restaurant_management_system.order;

import com.baraka.restaurant_management_system.menuitem.MenuItem;
import com.baraka.restaurant_management_system.menuitem.MenuItemRepository;
import com.baraka.restaurant_management_system.orderitem.OrderItem;
import com.baraka.restaurant_management_system.table.RestaurantTable;
import com.baraka.restaurant_management_system.table.RestaurantTableRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final RestaurantTableRepository restaurantTableRepository;

    public OrderServiceImpl(
            OrderRepository orderRepository,
            MenuItemRepository menuItemRepository,
            RestaurantTableRepository restaurantTableRepository
    ) {
        this.orderRepository = orderRepository;
        this.menuItemRepository = menuItemRepository;
        this.restaurantTableRepository = restaurantTableRepository;
    }

    @Override
    public Order createOrder(OrderRequest request) {

        Order order = new Order();

        order.setTableNumber(request.getTableNumber());
        order.setCustomerName(request.getCustomerName());
        order.setCustomerPhone(request.getCustomerPhone());
        order.setPaymentMethod(request.getPaymentMethod());

        order.setStatus("PENDING");

        List<OrderItem> orderItems = new ArrayList<>();

        BigDecimal total = BigDecimal.ZERO;

        int estimatedTime = 0;

        for (OrderRequest.OrderItemRequest itemRequest : request.getItems()) {

            MenuItem menuItem = menuItemRepository.findById(itemRequest.getMenuItemId())
                    .orElseThrow(() -> new RuntimeException("Menu item not found."));

            if (!menuItem.isAvailable()) {
                throw new RuntimeException(menuItem.getName() + " is currently unavailable.");
            }

            OrderItem orderItem = new OrderItem();

            orderItem.setOrder(order);
            orderItem.setMenuItem(menuItem);
            orderItem.setQuantity(itemRequest.getQuantity());
            orderItem.setPrice(menuItem.getPrice());

            BigDecimal itemTotal = menuItem.getPrice()
                    .multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

            total = total.add(itemTotal);

            estimatedTime = Math.max(
                    estimatedTime,
                    menuItem.getPreparationTime()
            );

            orderItems.add(orderItem);
        }

        order.setItems(orderItems);
        order.setTotalAmount(total);

        order.setEstimatedPreparationTime(estimatedTime);

        Order saved = orderRepository.save(order);

        // A new order means someone is now seated at this table — flip
        // it to OCCUPIED automatically, regardless of what it was before.
        // This is the ONLY place a table is claimed for real: viewing
        // the kiosk QR or browsing the menu never touches its status —
        // only actually placing an order does.
        restaurantTableRepository.findAll().stream()
                .filter(t -> t.getTableNumber() == request.getTableNumber())
                .findFirst()
                .ifPresent(table -> {
                    table.setStatus("OCCUPIED");
                    restaurantTableRepository.save(table);
                });

        return saved;
    }

    @Override
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Override
    public Order getOrderById(int id) {

        return orderRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Order not found."));
    }

    @Override
    public List<Order> getPendingPayments() {
        return orderRepository.findByStatusOrderByCreatedAtAsc(
                "PAYMENT_REQUESTED"
        );
    }

    @Override
    public Order getLatestOrderForTable(int tableNumber) {

        return orderRepository
                .findFirstByTableNumberOrderByCreatedAtDesc(tableNumber)
                .orElseThrow(() -> new RuntimeException("No order found."));
    }

    @Override
    public List<Order> getReviewedOrders() {
        return orderRepository.findByRatingIsNotNullOrderByIdDesc();
    }

    @Override
    public Order submitReview(int id, Integer rating, String comment) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found."));

        order.setRating(rating);
        order.setReviewComment(comment);
        order.setReviewRead(false);

        return orderRepository.save(order);
    }

    @Override
    public Order markReviewRead(int id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found."));

        order.setReviewRead(true);

        return orderRepository.save(order);
    }

    @Override
    public Order updateOrderStatus(int id, String status, String paymentMethod) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Order not found."));

        String newStatus = status.toUpperCase();

        switch (newStatus) {

            case "PREPARING":
            case "READY":
            case "SERVED":
            case "PAYMENT_REQUESTED":
            case "PAID":
            case "COMPLETED":

                order.setStatus(newStatus);
                break;

            default:
                throw new RuntimeException("Invalid order status.");
        }

        if (paymentMethod != null && !paymentMethod.isBlank()) {
            order.setPaymentMethod(paymentMethod.toUpperCase());
        }

        if (newStatus.equals("SERVED")) {
            order.setServedAt(LocalDateTime.now());
        }

        if ("PAID".equals(newStatus)) {
            order.setPaidAt(LocalDateTime.now());
        }

        // NOTE: the table's status is deliberately NOT touched here
        // anymore. Two-state model now: OCCUPIED while there's any
        // active session at the table (including the post-payment
        // review/rating screens — the customer is still physically
        // there), AVAILABLE once the customer actually finishes the
        // session. That transition happens from the customer side —
        // see CustomerOrderPage.jsx's finishSession(), which PATCHes
        // this table straight to AVAILABLE once review is submitted
        // or skipped. This avoids a NEEDS_CLEANING middle state and
        // the extra manual staff step that came with it.

        return orderRepository.save(order);
    }

}
