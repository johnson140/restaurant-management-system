import { getTableStatusMeta, TABLE_STATUS_CYCLE } from "@/utils/statusMeta";

/**
 * Tap-to-cycle table tile. Used identically in Dashboard, ServiceBoard,
 * and Tables — previously each page had its own copy of this component
 * and its own color map. Now one component, one status source of truth.
 */
export default function TableStatusTile({ table, onSetStatus }) {
  const meta = getTableStatusMeta(table.status);
  const nextStatus = TABLE_STATUS_CYCLE[table.status] || "AVAILABLE";

  return (
    <button
      type="button"
      className={`table-tile status-${meta.tone}`}
      onClick={() => onSetStatus(table.id, nextStatus)}
      title={`Tap to mark ${TABLE_STATUS_CYCLE[table.status] || "Available"}`}
    >
      <div className="table-tile-number">T{table.tableNumber}</div>
      <div className="table-tile-status">{meta.label}</div>
    </button>
  );
}
