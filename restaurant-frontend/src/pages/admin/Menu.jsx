import { useEffect, useState } from "react";
import api from "@/services/axios";
import MenuModal from "@/components/modals/MenuModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/context/ToastContext";

import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// Small FSSAI-style veg/non-veg mark, matches the one used on the
// customer-facing menu and inside MenuModal's diet-type picker.
//
// veg is tri-state: true/false render the usual green/red mark; null
// (the "Default" tier — drinks, etc. with no meaningful classification)
// renders NOTHING — no icon, no color, no border. This matches the
// customer page exactly.
function VegDot({ veg }) {
  if (veg === null) return null;

  return (
    <span
      title={veg ? "Veg" : "Non-Veg"}
      style={{
        display: "inline-flex",
        width: 14,
        height: 14,
        border: `2px solid ${veg ? "#0a8a0a" : "#a5291d"}`,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: veg ? "#0a8a0a" : "#a5291d",
        }}
      />
    </span>
  );
}

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
      <PageHeader
        eyebrow="CATALOG"
        title="Menu Management"
        subtitle={`${menu.length} item${menu.length === 1 ? "" : "s"} total`}
        actions={<Button onClick={openAddModal}>+ Add Menu Item</Button>}
      />

      <input
        className="search-box"
        type="text"
        placeholder="Search menu items..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "var(--space-5)" }}
      />

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Price</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}></th>
            </tr>
          </thead>

          {loading ? (
            <TableSkeleton rows={4} columns={5} />
          ) : (
            <tbody>
              {filteredMenu.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      title="No matches"
                      body="No menu items match your search."
                    />
                  </td>
                </tr>
              )}

              {filteredMenu.map((item) => (
                <tr key={item.id} style={styles.tr}>
                  <td style={styles.td}>{item.id}</td>
                  <td style={styles.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {/* item.veg is undefined for rows saved before this field
                          existed — treat that as veg so nothing old shows red
                          until an admin explicitly re-saves it. Rows explicitly
                          set to null ("Default") render the neutral dashed mark. */}
                      <VegDot veg={item.veg === undefined ? true : item.veg} />
                      {item.name}
                    </div>
                  </td>
                  <td style={styles.td}>₹{item.price}</td>
                  <td style={styles.td}>
                    <StatusBadge
                      status={item.available}
                      label={item.available ? "Available" : "Unavailable"}
                      tone={item.available ? "success" : "neutral"}
                    />
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
              ))}
            </tbody>
          )}
        </table>
      </Card>

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

export default Menu;
