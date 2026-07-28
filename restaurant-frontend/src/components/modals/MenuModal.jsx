import { useEffect, useState } from "react";

// Used for both "Add Menu Item" and "Edit Menu Item".
// editingItem === null means "add" mode.
function MenuModal({ open, onClose, onSave, editingItem }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setPrice(editingItem.price);
      setAvailable(editingItem.available);
    } else {
      setName("");
      setPrice("");
      setAvailable(true);
    }
  }, [editingItem, open]);

  if (!open) return null;

  function submit(e) {
    e.preventDefault();

    onSave({
      name,
      price: Number(price),
      available,
    });
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</h2>

        <form onSubmit={submit}>
          <input
            type="text"
            placeholder="Food name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="number"
            step="0.01"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
            />
            Available
          </label>

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

export default MenuModal;
