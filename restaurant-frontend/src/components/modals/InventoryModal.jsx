import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

function InventoryModal({ open, onClose, onSave, editingItem }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setQuantity(editingItem.quantity);
      setLowStockThreshold(editingItem.lowStockThreshold ?? "5");
    } else {
      setName("");
      setQuantity("");
      setLowStockThreshold("5");
    }
  }, [editingItem, open]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name,
        quantity: Number(quantity),
        lowStockThreshold: Number(lowStockThreshold),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editingItem ? "Edit Ingredient" : "Add Ingredient"}>
      <form onSubmit={submit} style={css.form}>
        <div style={css.field}>
          <label style={css.label}>Ingredient name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={css.input} required />
        </div>

        <div style={css.field}>
          <label style={css.label}>Quantity</label>
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={css.input} required />
        </div>

        <div style={css.field}>
          <label style={css.label}>Low stock threshold</label>
          <input type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} style={css.input} required />
        </div>

        <div style={css.actions}>
          <Button type="submit" loading={saving}>Save</Button>
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}

const css = {
  form: { display: "flex", flexDirection: "column", gap: "var(--space-4)" },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--text-muted)" },
  input: {
    padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)",
    background: "var(--bg-page)", color: "var(--text-primary)", fontSize: "var(--font-size-base)",
  },
  actions: { display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)" },
};

export default InventoryModal;