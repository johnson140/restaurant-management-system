package com.baraka.restaurant_management_system.order;

import java.util.List;

public interface OrderService {

    Order createOrder(OrderRequest request);

    List<Order> getAllOrders();

    Order getOrderById(int id);

    Order getLatestOrderForTable(int tableNumber);

    Order updateOrderStatus(int id, String status);

}