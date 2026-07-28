package com.baraka.restaurant_management_system.staff;

import java.util.List;

public interface StaffService {
    Staff createStaff(Staff staff);
    List<Staff> getAllStaff();
    Staff getStaffById(int id);
    Staff updateStaff(int id, Staff staff);
    void deleteStaff(int id);
    int getStaffCount();
}