import { useEffect, useState } from "react";
import api from "@/services/axios";
import StaffModal from "@/components/modals/StaffModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

function Staff() {
  const { showToast } = useToast();
  const { user } = useAuth();

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
      const backendMessage = error?.response?.data?.message || error?.response?.data?.error;
      showToast(backendMessage || "Could not save staff member", "error");
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
      const backendMessage = error?.response?.data?.message || error?.response?.data?.error;
      showToast(backendMessage || "Could not delete staff member", "error");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="TEAM"
        title="Staff"
        subtitle={`${staff.length} member${staff.length === 1 ? "" : "s"}`}
        actions={<Button onClick={openAddModal}>+ Add Staff Member</Button>}
      />

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Username</th>
              <th style={styles.th}>Phone</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}></th>
            </tr>
          </thead>

          {loading ? (
            <TableSkeleton rows={4} columns={6} />
          ) : (
            <tbody>
              {staff.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState title="No staff yet" body="Add your first staff member above." />
                  </td>
                </tr>
              )}

              {staff.map((member) => (
                <tr key={member.id} style={styles.tr}>
                  <td style={styles.td}>{member.id}</td>
                  <td style={styles.td}>{member.name}</td>
                  <td style={styles.td}>{member.username}</td>
                  <td style={styles.td}>{member.phoneNumber}</td>
                  <td style={styles.td}>{member.role}</td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <Button size="sm" variant="secondary" onClick={() => openEditModal(member)}>
                        Edit
                      </Button>
                      {member.username !== user?.username && (
                        <Button size="sm" variant="danger" onClick={() => setDeleteTarget(member)}>
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </Card>

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

const styles = {
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "var(--space-4) var(--space-6)",
    fontSize: "var(--font-size-xs)",
    fontWeight: "var(--font-weight-bold)",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    borderBottom: "1px solid var(--border-color)",
  },
  tr: { borderBottom: "1px solid var(--border-color)" },
  td: {
    padding: "var(--space-4) var(--space-6)",
    color: "var(--text-primary)",
    fontSize: "var(--font-size-base)",
  },
};

export default Staff;