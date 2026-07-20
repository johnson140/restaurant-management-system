package com.baraka.restaurant_management_system.model;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name="menuItem")
public class MenuItem{

    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private int id;


    private String name;
    private BigDecimal price;
    private boolean available=true;

    public MenuItem() {}

    public MenuItem(String name, BigDecimal price) {
        this.name = name;
        this.price = price;
    }

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setId(int id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }
    public boolean isAvailable() {
        return available;
    }


    public void setAvailable(boolean available) {
        this.available = available;
    }
}
