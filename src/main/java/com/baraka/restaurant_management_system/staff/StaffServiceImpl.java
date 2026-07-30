package com.baraka.restaurant_management_system.staff;

import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;

// NOTE: passwords are stored in plain text here, matching AuthController's
// plain .equals() comparison. This is intentionally NOT production-safe —
// it's a deliberate, temporary decision to keep the whole staff/auth
// system consistent (all-plaintext) while the rest of the app is being
// built, rather than half-hashed like it was before (existing rows were
// plaintext, but this service was hashing new ones, so newly created
// staff could never log in). Revisit before this goes anywhere real:
// switch back to BCrypt in both this file AND AuthController together,
// and re-save every existing staff member's password once that happens.
@Service
public class StaffServiceImpl implements StaffService {

    private final StaffRepository staffRepository;

    public StaffServiceImpl(StaffRepository staffRepository) {
        this.staffRepository = staffRepository;
    }

    @Override
    public Staff createStaff(Staff staff) {

        if (staffRepository.existsByUsername(staff.getUsername())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Username already exists");
        }

        if (staff.getPassword() == null || staff.getPassword().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password is required");
        }

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

        // Blank/omitted password on update means "keep the existing one" —
        // this is intentional so editing a staff member's role/phone
        // doesn't force a password reset every time.
        if (updatedStaff.getPassword() != null &&
                !updatedStaff.getPassword().isBlank()) {
            existingStaff.setPassword(updatedStaff.getPassword());
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