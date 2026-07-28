package com.baraka.restaurant_management_system.dashboard;

import java.math.BigDecimal;

public class DashboardSummary {

    private BigDecimal todayRevenue;
    private BigDecimal monthlyRevenue;
    private long todayOrders;
    private long todayCustomers;
    private long staffCount;
    private long lowStockCount;

    public DashboardSummary() {
    }

    public DashboardSummary(BigDecimal todayRevenue,
                            BigDecimal monthlyRevenue,
                            long todayOrders,
                            long todayCustomers,
                            long staffCount,
                            long lowStockCount) {

        this.todayRevenue = todayRevenue;
        this.monthlyRevenue = monthlyRevenue;
        this.todayOrders = todayOrders;
        this.todayCustomers = todayCustomers;
        this.staffCount = staffCount;
        this.lowStockCount = lowStockCount;
    }

    public BigDecimal getTodayRevenue() {
        return todayRevenue;
    }

    public void setTodayRevenue(BigDecimal todayRevenue) {
        this.todayRevenue = todayRevenue;
    }

    public BigDecimal getMonthlyRevenue() {
        return monthlyRevenue;
    }

    public void setMonthlyRevenue(BigDecimal monthlyRevenue) {
        this.monthlyRevenue = monthlyRevenue;
    }

    public long getTodayOrders() {
        return todayOrders;
    }

    public void setTodayOrders(long todayOrders) {
        this.todayOrders = todayOrders;
    }

    public long getTodayCustomers() {
        return todayCustomers;
    }

    public void setTodayCustomers(long todayCustomers) {
        this.todayCustomers = todayCustomers;
    }

    public long getStaffCount() {
        return staffCount;
    }

    public void setStaffCount(long staffCount) {
        this.staffCount = staffCount;
    }

    public long getLowStockCount() {
        return lowStockCount;
    }

    public void setLowStockCount(long lowStockCount) {
        this.lowStockCount = lowStockCount;
    }
}