import { useEffect, useState } from "react";
import api from "../services/axios";
import MenuModal from "../components/modals/MenuModal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { TableSkeleton } from "../components/common/Skeleton";
import { useToast } from "../context/ToastContext";

function Menu() {
  const { showToast } = useToast();

  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    loadMenu();
  }, []);

  async function loadMenu() {
    try {
      setLoading(true);
      const res = await api.get("/menu");
      setMenu(res.data);
    } catch (err) {
      console.error(err);
      showToast("Could not load menu", "error");
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

  async function saveItem(formData) {
    try {
      if (editingItem) {
        await api.put(`/menu/${editingItem.id}`, formData);
        showToast("Menu item updated");
      } else {
        await api.post("/menu", formData);
        showToast("Menu item added");
      }

      setModalOpen(false);
      loadMenu();
    } catch (err) {
      console.error(err);
      showToast("Could not save menu item", "error");
    }
  }

  async function confirmDelete() {
    try {
      await api.delete(`/menu/${deleteTarget.id}`);
      showToast("Menu item deleted");
      setDeleteTarget(null);
      loadMenu();
    } catch (err) {
      console.error(err);
      showToast("Could not delete menu item", "error");
    }
  }

  const filteredMenu = menu.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Menu Management</h2>
        <button onClick={openAddModal}>+ Add Menu Item</button>
      </div>

      <input
        className="search-box"
        type="text"
        placeholder="Search menu items..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Price</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          {loading ? (
            <TableSkeleton rows={4} columns={5} />
          ) : (
            <tbody>
              {filteredMenu.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-row">
                    No menu items match your search.
                  </td>
                </tr>
              )}

              {filteredMenu.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>₹{item.price}</td>
                  <td>
                    <span
                      className={`badge ${
                        item.available ? "badge-green" : "badge-gray"
                      }`}
                    >
                      {item.available ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openEditModal(item)}>Edit</button>
                    <button
                      className="danger"
                      onClick={() => setDeleteTarget(item)}
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

      <MenuModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={saveItem}
        editingItem={editingItem}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete menu item"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? This cannot be undone.`
            : ""
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default Menu;
