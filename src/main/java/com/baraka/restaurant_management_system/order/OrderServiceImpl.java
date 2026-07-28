package com.baraka.restaurant_management_system.order;

import com.baraka.restaurant_management_system.menuitem.MenuItem;
import com.baraka.restaurant_management_system.menuitem.MenuItemRepository;
import com.baraka.restaurant_management_system.orderitem.OrderItem;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;

    public OrderServiceImpl(
            OrderRepository orderRepository,
            MenuItemRepository menuItemRepository
    ) {
        this.orderRepository = orderRepository;
        this.menuItemRepository = menuItemRepository;
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

        return orderRepository.save(order);
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
    public Order getLatestOrderForTable(int tableNumber) {

        return orderRepository
                .findFirstByTableNumberOrderByCreatedAtDesc(tableNumber)
                .orElseThrow(() -> new RuntimeException("No order found."));
    }

    @Override
    public Order updateOrderStatus(int id, String status) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Order not found."));

        String newStatus = status.toUpperCase();

        switch (newStatus) {

            case "PREPARING":
            case "READY":
            case "SERVED":
            case "PAYMENT_PENDING":
            case "PAID":
            case "COMPLETED":

                order.setStatus(newStatus);
                break;

            default:
                throw new RuntimeException("Invalid order status.");
        }

        if (newStatus.equals("SERVED")) {
            order.setServedAt(LocalDateTime.now());
        }

        if (newStatus.equals("PAID")) {
            order.setPaidAt(LocalDateTime.now());
        }

        return orderRepository.save(order);
    }
}