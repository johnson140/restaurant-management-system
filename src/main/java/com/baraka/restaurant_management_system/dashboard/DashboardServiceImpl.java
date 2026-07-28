package com.baraka.restaurant_management_system.dashboard;

import com.baraka.restaurant_management_system.order.Order;
import com.baraka.restaurant_management_system.order.OrderRepository;
import com.baraka.restaurant_management_system.ingredient.IngredientService;
import com.baraka.restaurant_management_system.staff.StaffService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DashboardServiceImpl implements DashboardService {

    private final OrderRepository orderRepository;
    private final StaffService staffService;
    private final IngredientService ingredientService;

    @Autowired
    public DashboardServiceImpl(OrderRepository orderRepository,
                                StaffService staffService,
                                IngredientService ingredientService) {
        this.orderRepository = orderRepository;
        this.staffService = staffService;
        this.ingredientService = ingredientService;
    }

    @Override
    public DashboardSummary getSummary() {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime endOfToday = startOfToday.plusDays(1);

        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1);

        List<Order> todaysOrders = orderRepository.findByCreatedAtBetween(startOfToday, endOfToday);
        List<Order> monthsOrders = orderRepository.findByCreatedAtBetween(startOfMonth, endOfMonth);

        BigDecimal todayRevenue = todaysOrders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal monthlyRevenue = monthsOrders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Set<Integer> distinctTablesToday = todaysOrders.stream()
                .map(Order::getTableNumber)
                .collect(Collectors.toSet());

        return new DashboardSummary(
                todayRevenue,
                monthlyRevenue,
                todaysOrders.size(),
                distinctTablesToday.size(),
                staffService.getStaffCount(),
                ingredientService.getLowStockIngredients().size()
        );
    }
}