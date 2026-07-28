import { useEffect, useState } from "react";
import api from "../services/axios";
import StaffModal from "../components/modals/StaffModal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { TableSkeleton } from "../components/common/Skeleton";
import { useToast } from "../context/ToastContext";

function Staff() {
  const { showToast } = useToast();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    try {
      setLoading(true);
      const response = await api.get("/staff");
      setStaff(response.data);
    } catch (error) {
      console.error(error);
      showToast("Could not load staff", "error");
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingItem(null);
    setModalOpen(true);
  }

  function openEditModal(item) {
    setEditingItem(item);
    setModalOpen(true);
  }

  async function saveStaff(formData) {
    try {
      if (editingItem) {
        await api.put(`/staff/${editingItem.id}`, formData);
        showToast("Staff member updated");
      } else {
        await api.post("/staff", formData);
        showToast("Staff member added");
      }

      setModalOpen(false);
      fetchStaff();
    } catch (error) {
      console.error(error);
      showToast("Could not save staff member", "error");
    }
  }

  async function confirmDelete() {
    try {
      await api.delete(`/staff/${deleteTarget.id}`);
      showToast("Staff member removed");
      setDeleteTarget(null);
      fetchStaff();
    } catch (error) {
      console.error(error);
      showToast("Could not delete staff member", "error");
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Staff</h2>
        <button onClick={openAddModal}>+ Add Staff Member</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th></th>
            </tr>
          </thead>

          {loading ? (
            <TableSkeleton rows={4} columns={5} />
          ) : (
            <tbody>
              {staff.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-row">
                    No staff members yet.
                  </td>
                </tr>
              )}

              {staff.map((member) => (
                <tr key={member.id}>
                  <td>{member.id}</td>
                  <td>{member.name}</td>
                  <td>{member.username}</td>
                  <td>{member.role}</td>
                  <td>
                    <button onClick={() => openEditModal(member)}>
                      Edit
                    </button>
                    <button
                      className="danger"
                      onClick={() => setDeleteTarget(member)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      <StaffModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={saveStaff}
        editingItem={editingItem}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Remove staff member"
        message={
          deleteTarget ? `Remove "${deleteTarget.name}" from staff?` : ""
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default Staff;
