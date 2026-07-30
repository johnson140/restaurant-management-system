package com.baraka.restaurant_management_system.staff;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(
        name = "staff",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "username")
        }
)
public class Staff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @NotBlank(message = "Username is required")
    @Column(nullable = false, unique = true)
    private String username;

    // IMPORTANT: this used to be @JsonIgnore, which blocks Jackson in
    // BOTH directions — it stops password from being serialized back to
    // the browser (good, that part was intentional) but it ALSO stops
    // an incoming request body's "password" field from being bound onto
    // this object at all (bad — this is why staff creation was silently
    // losing the password). WRITE_ONLY keeps the "never send it back"
    // behavior while still allowing it to be read from requests.
    //
    // Password is optional at the bean-validation level (no @NotBlank)
    // because PUT /staff/{id} treats a blank password as "leave it
    // unchanged" — see StaffServiceImpl#updateStaff. POST /staff (create)
    // enforces it's non-blank in StaffServiceImpl instead, since that's
    // a create-only rule.
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(nullable = false)
    private String password;

    @NotBlank(message = "Name is required")
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "Role is required")
    @Column(nullable = false)
    private String role;

    @NotBlank(message = "Phone number is required")
    @Column(nullable = false)
    private String phoneNumber;

    public Staff() {
    }

    public Staff(String username,
                 String password,
                 String name,
                 String role,
                 String phoneNumber) {

        this.username = username;
        this.password = password;
        this.name = name;
        this.role = role;
        this.phoneNumber = phoneNumber;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username == null ? null : username.trim();
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name == null ? null : name.trim();
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role == null ? null : role.trim().toUpperCase();
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber == null ? null : phoneNumber.trim();
    }
}
