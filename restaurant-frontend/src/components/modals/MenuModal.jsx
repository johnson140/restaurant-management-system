// components/modals/MenuModal.jsx — full file
import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

function MenuModal({ open, onClose, onSave, editingItem }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [available, setAvailable] = useState(true);
  // Tri-state: true = Veg, false = Non-Veg, null = Default (no tag,
  // shows on both Veg and Non-Veg views on the customer page — meant
  // for items like drinks that don't have a meaningful classification).
  const [veg, setVeg] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setPrice(editingItem.price);
      setAvailable(editingItem.available);
      // Fallback to true for items saved before the veg field existed
      // (avoids showing an unchecked box for older rows that are actually veg).
      setVeg(editingItem.veg === undefined ? true : editingItem.veg);
    } else {
      setName("");
      setPrice("");
      setAvailable(true);
      setVeg(true);
    }
  }, [editingItem, open]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ name, price: Number(price), available, veg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editingItem ? "Edit Menu Item" : "Add Menu Item"}>
      <form onSubmit={submit} style={css.form}>
        <div style={css.field}>
          <label style={css.label}>Food name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={css.input}
            required
          />
        </div>

        <div style={css.field}>
          <label style={css.label}>Price</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={css.input}
            required
          />
        </div>

        <label style={css.checkboxRow}>
          <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
          Available
        </label>

        <div style={css.dietField}>
          <span style={css.label}>Diet type</span>
          <div style={css.dietOptions}>
            <label style={{ ...css.dietPill, ...(veg === true ? css.dietPillVegActive : {}) }}>
              <input
                type="radio"
                name="veg-type"
                checked={veg === true}
                onChange={() => setVeg(true)}
                style={css.hiddenRadio}
              />
              <span style={css.dietDot(true)}>
                <span style={css.dietDotInner(true)} />
              </span>
              Veg
            </label>

            <label style={{ ...css.dietPill, ...(veg === false ? css.dietPillNonVegActive : {}) }}>
              <input
                type="radio"
                name="veg-type"
                checked={veg === false}
                onChange={() => setVeg(false)}
                style={css.hiddenRadio}
              />
              <span style={css.dietDot(false)}>
                <span style={css.dietDotInner(false)} />
              </span>
              Non-Veg
            </label>

            <label style={{ ...css.dietPill, ...(veg === null ? css.dietPillDefaultActive : {}) }}>
              <input
                type="radio"
                name="veg-type"
                checked={veg === null}
                onChange={() => setVeg(null)}
                style={css.hiddenRadio}
              />
              <span style={css.dietDotNeutral} />
              Default
            </label>
          </div>
          <span style={css.dietHint}>
            Default items (e.g. drinks) show no tag and appear on both the
            Veg and Non-Veg pages.
          </span>
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
  checkboxRow: { display: "flex", alignItems: "center", gap: 10, fontSize: "var(--font-size-base)", color: "var(--text-primary)" },

  // --- diet type radio-pills, matches the checkbox row's density/spacing ---
  dietField: { display: "flex", flexDirection: "column", gap: 8 },
  dietOptions: { display: "flex", gap: 10, flexWrap: "wrap" },
  dietPill: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 16px", borderRadius: "999px",
    border: "1px solid var(--border-color)",
    fontSize: "var(--font-size-base)", color: "var(--text-primary)",
    cursor: "pointer", userSelect: "none",
  },
  dietPillVegActive: { border: "1px solid #0a8a0a", background: "rgba(10,138,10,0.08)" },
  dietPillNonVegActive: { border: "1px solid #a5291d", background: "rgba(165,41,29,0.08)" },
  dietPillDefaultActive: { border: "1px solid var(--text-muted)", background: "rgba(120,120,120,0.08)" },
  hiddenRadio: { position: "absolute", opacity: 0, width: 0, height: 0 },
  dietDot: (isVeg) => ({
    display: "inline-flex", width: 14, height: 14,
    border: `2px solid ${isVeg ? "#0a8a0a" : "#a5291d"}`,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  }),
  dietDotInner: (isVeg) => ({
    width: 6, height: 6, borderRadius: "50%",
    background: isVeg ? "#0a8a0a" : "#a5291d",
  }),
  // "Default" option gets a neutral dashed/gray dot instead of a veg or
  // non-veg mark, so it visually reads as "no classification" at a glance.
  dietDotNeutral: {
    display: "inline-flex", width: 14, height: 14,
    border: "2px dashed var(--text-muted)",
    flexShrink: 0,
  },
  dietHint: { fontSize: "var(--font-size-xs)", color: "var(--text-muted)" },

  actions: { display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)" },
};

export default MenuModal;
