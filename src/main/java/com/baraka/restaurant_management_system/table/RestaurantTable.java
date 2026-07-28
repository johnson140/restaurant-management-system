package com.baraka.restaurant_management_system.table;

import jakarta.persistence.*;

@Entity
@Table(
        name = "restaurant_tables",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "tableNumber"),
                @UniqueConstraint(columnNames = "token")
        }
)
public class RestaurantTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(nullable = false, unique = true)
    private int tableNumber;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private String status = "AVAILABLE";

    public RestaurantTable() {
    }

    public RestaurantTable(int tableNumber, String token) {
        this.tableNumber = tableNumber;
        this.token = token;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getTableNumber() {
        return tableNumber;
    }

    public void setTableNumber(int tableNumber) {
        this.tableNumber = tableNumber;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token == null ? null : token.trim();
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status == null ? "AVAILABLE" : status.trim().toUpperCase();
    }
}