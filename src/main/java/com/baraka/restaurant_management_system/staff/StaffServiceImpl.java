package com.baraka.restaurant_management_system.staff;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;

@Service
public class StaffServiceImpl implements StaffService {

    private final StaffRepository staffRepository;
    private final PasswordEncoder passwordEncoder;

    public StaffServiceImpl(StaffRepository staffRepository,
                            PasswordEncoder passwordEncoder) {
        this.staffRepository = staffRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Staff createStaff(Staff staff) {

        if (staffRepository.existsByUsername(staff.getUsername())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Username already exists");
        }

        staff.setPassword(passwordEncoder.encode(staff.getPassword()));

        return staffRepository.save(staff);
    }

    @Override
    public List<Staff> getAllStaff() {
        return staffRepository.findAll();
    }

    @Override
    public Staff getStaffById(int id) {
        return staffRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Staff not found"));
    }

    @Override
    public Staff updateStaff(int id, Staff updatedStaff) {

        Staff existingStaff = staffRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Staff not found"));

        existingStaff.setUsername(updatedStaff.getUsername());

        if (updatedStaff.getPassword() != null &&
                !updatedStaff.getPassword().isBlank()) {
            existingStaff.setPassword(
                    passwordEncoder.encode(updatedStaff.getPassword()));
        }

        existingStaff.setName(updatedStaff.getName());
        existingStaff.setRole(updatedStaff.getRole());
        existingStaff.setPhoneNumber(updatedStaff.getPhoneNumber());

        return staffRepository.save(existingStaff);
    }

    @Override
    public void deleteStaff(int id) {

        if (!staffRepository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Staff not found");
        }

        staffRepository.deleteById(id);
    }

    @Override
    public int getStaffCount() {
        return (int) staffRepository.count();
    }
}