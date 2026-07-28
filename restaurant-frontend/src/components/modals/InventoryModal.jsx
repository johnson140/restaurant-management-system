import { useEffect, useState } from "react";

function InventoryModal({ open, onClose, onSave, editingItem }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");

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

  if (!open) return null;

  function submit(e) {
    e.preventDefault();

    onSave({
      name,
      quantity: Number(quantity),
      lowStockThreshold: Number(lowStockThreshold),
    });
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{editingItem ? "Edit Ingredient" : "Add Ingredient"}</h2>

        <form onSubmit={submit}>
          <input
            type="text"
            placeholder="Ingredient name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Low stock threshold"
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(e.target.value)}
            required
          />

          <div className="modal-buttons">
            <button type="submit">Save</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InventoryModal;
