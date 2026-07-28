import { useEffect, useState } from "react";
import api from "../services/axios";
import InventoryModal from "../components/modals/InventoryModal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { TableSkeleton } from "../components/common/Skeleton";
import { useToast } from "../context/ToastContext";

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
      <div className="page-header">
        <h2 className="page-title">Inventory</h2>
        <button onClick={openAddModal}>+ Add Ingredient</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Quantity</th>
              <th></th>
            </tr>
          </thead>

          {loading ? (
            <TableSkeleton rows={4} columns={4} />
          ) : (
            <tbody>
              {ingredients.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-row">
                    No ingredients tracked yet.
                  </td>
                </tr>
              )}

              {ingredients.map((item) => {
                const isLow = item.quantity <= (item.lowStockThreshold ?? 5);

                return (
                  <tr key={item.id} className={isLow ? "row-low-stock" : ""}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>
                      {item.quantity}
                      {isLow && (
                        <span className="badge badge-red">Low stock</span>
                      )}
                    </td>
                    <td>
                      <button onClick={() => openEditModal(item)}>
                        Edit
                      </button>
                      <button
                        className="danger"
                        onClick={() => setDeleteTarget(item)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
      </div>

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
