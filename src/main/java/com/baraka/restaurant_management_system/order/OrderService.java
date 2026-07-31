
package com.baraka.restaurant_management_system.order;

import java.util.List;

public interface OrderService {

    Order createOrder(OrderRequest request);

    List<Order> getAllOrders();

    Order getOrderById(int id);

    Order getLatestOrderForTable(int tableNumber);

    Order updateOrderStatus(int id, String status, String paymentMethod);

    List<Order> getPendingPayments();

    Order submitReview(int id, Integer rating, String comment);

    List<Order> getReviewedOrders();

    Order markReviewRead(int id);

}