// staff/StaffController.java — full file
package com.baraka.restaurant_management_system.staff;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/staff")
public class StaffController {

    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    @GetMapping
    public List<Staff> getAllStaff() {
        return staffService.getAllStaff();
    }

    @GetMapping("/{id}")
    public Staff getStaffById(@PathVariable("id") int id) {
        return staffService.getStaffById(id);
    }

    @PostMapping
    public Staff createStaff(@Valid @RequestBody Staff staff) {
        return staffService.createStaff(staff);
    }

    @PutMapping("/{id}")
    public Staff updateStaff(@PathVariable("id") int id,
                             @Valid @RequestBody Staff staff) {
        return staffService.updateStaff(id, staff);
    }

    @DeleteMapping("/{id}")
    public void deleteStaff(@PathVariable("id") int id, Authentication authentication) {
        // authentication.getName() is whatever JwtAuthFilter set as the
        // principal — matching your login flow, this is the username.
        // Block deleting your own account: the frontend also hides this
        // button, but the backend is the check that actually matters,
        // since nothing stops a direct API call otherwise.
        String currentUsername = authentication.getName();
        Staff target = staffService.getStaffById(id);

        if (target.getUsername().equalsIgnoreCase(currentUsername)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You cannot delete your own account.");
        }

        staffService.deleteStaff(id);
    }
}