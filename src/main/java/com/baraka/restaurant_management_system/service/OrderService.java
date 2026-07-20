package com.baraka.restaurant_management_system.service;

import com.baraka.restaurant_management_system.model.Order;
import com.baraka.restaurant_management_system.model.OrderRequest;
import java.util.List;

public interface OrderService {
    Order createOrder(OrderRequest request);
    List<Order> getAllOrders();
    Order getOrderById(int id);
    Order updateOrderStatus(int id, String status);
}