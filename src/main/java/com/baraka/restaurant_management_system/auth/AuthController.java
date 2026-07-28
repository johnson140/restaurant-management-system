package com.baraka.restaurant_management_system.auth;

import com.baraka.restaurant_management_system.staff.Staff;
import com.baraka.restaurant_management_system.staff.StaffRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final StaffRepository staffRepository;
    private final JwtUtil jwtUtil;

    public AuthController(StaffRepository staffRepository, JwtUtil jwtUtil) {
        this.staffRepository = staffRepository;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody LoginRequest request) {

        Staff staff = staffRepository.findAll()
                .stream()
                .filter(s ->
                        s.getUsername() != null &&
                                s.getUsername().equals(request.getUsername()) &&
                                s.getPassword() != null &&
                                s.getPassword().equals(request.getPassword()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        String token = jwtUtil.generateToken(
                staff.getUsername(),
                staff.getRole()
        );

        return Map.of(
                "token", token,
                "role", staff.getRole(),
                "name", staff.getName(),
                "username", staff.getUsername()
        );
    }
}