import { useEffect, useState } from "react";
import api from "@/services/axios";
import InventoryModal from "@/components/modals/InventoryModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/context/ToastContext";

import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function Inventory() {
  const { showToast } = useToast();

  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    loadIngredients();
  }, []);

  async function loadIngredients() {
    try {
      setLoading(true);
      const res = await api.get("/ingredients");
      setIngredients(res.data);
    } catch (err) {
      console.error(err);
      showToast("Could not load inventory", "error");
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

  async function saveIngredient(formData) {
    try {
      if (editingItem) {
        await api.put(`/ingredients/${editingItem.id}`, formData);
        showToast("Ingredient updated");
      } else {
        await api.post("/ingredients", formData);
        showToast("Ingredient added");
      }

      setModalOpen(false);
      loadIngredients();
    } catch (err) {
      console.error(err);
      showToast("Could not save ingredient", "error");
    }
  }

  async function confirmDelete() {
    try {
      await api.delete(`/ingredients/${deleteTarget.id}`);
      showToast("Ingredient deleted");
      setDeleteTarget(null);
      loadIngredients();
    } catch (err) {
      console.error(err);
      showToast("Could not delete ingredient", "error");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="STOCK"
        title="Inventory"
        subtitle={`${ingredients.length} ingredient${ingredients.length === 1 ? "" : "s"} tracked`}
        actions={<Button onClick={openAddModal}>+ Add Ingredient</Button>}
      />

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Quantity</th>
              <th style={styles.th}></th>
            </tr>
          </thead>

          {loading ? (
            <TableSkeleton rows={4} columns={4} />
          ) : (
            <tbody>
              {ingredients.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <EmptyState title="Nothing tracked yet" body="Add your first ingredient above." />
                  </td>
                </tr>
              )}

              {ingredients.map((item) => {
                const isLow = item.quantity <= (item.lowStockThreshold ?? 5);

                return (
                  <tr
                    key={item.id}
                    style={{
                      ...styles.tr,
                      background: isLow ? "var(--color-warning-soft)" : "transparent",
                    }}
                  >
                    <td style={styles.td}>{item.id}</td>
                    <td style={styles.td}>{item.name}</td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        {item.quantity}
                        {isLow && (
                          <StatusBadge status="LOW" label="Low stock" tone="danger" />
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: "var(--space-2)" }}>
                        <Button size="sm" variant="secondary" onClick={() => openEditModal(item)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setDeleteTarget(item)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </Card>

      <InventoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={saveIngredient}
        editingItem={editingItem}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete ingredient"
        message={
          deleteTarget ? `Delete "${deleteTarget.name}" from inventory?` : ""
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
