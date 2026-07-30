package com.baraka.restaurant_management_system.menuitem;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "menu_items")
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String name;
    private BigDecimal price;
    private boolean available = true;
    private String category;

    // Tri-state diet classification:
    //   TRUE  = Veg
    //   FALSE = Non-Veg
    //   NULL  = Default (no classification — e.g. drinks; shows no tag
    //           and appears on both Veg and Non-Veg views on the
    //           customer page)
    //
    // Must be the boxed Boolean, not primitive boolean — a primitive
    // can never represent null, so it was silently collapsing every
    // "Default" selection down to false the moment Jackson deserialized
    // the request body.
    @Column(nullable = true)
    private Boolean veg = true;

    @Column(nullable = false)
    private int preparationTime = 10;

    public MenuItem() {
    }

    public MenuItem(
            String name,
            BigDecimal price,
            int preparationTime
    ) {
        this.name = name;
        this.price = price;
        this.preparationTime = preparationTime;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getPrice() {
        return price;
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public int getPreparationTime() {
        return preparationTime;
    }

    public Boolean getVeg() {
        return veg;
    }

    public void setVeg(Boolean veg) {
        this.veg = veg;
    }

    public void setPreparationTime(int preparationTime) {
        this.preparationTime = preparationTime;
    }
}
