import { useEffect, useState } from "react";
import api from "@/services/axios";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/context/ToastContext";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { getTableStatusMeta, TABLE_STATUS_CYCLE } from "@/utils/statusMeta";
import { FaChair } from "react-icons/fa6";

function customerUrlFor(token) {
  return `${window.location.origin}/customer?token=${token}`;
}

function qrImageUrlFor(token) {
  const url = customerUrlFor(token);
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encodeURIComponent(url)}`;
}

function Tables() {
  const { showToast } = useToast();

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newTableNumber, setNewTableNumber] = useState("");
  const [creating, setCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [qrTarget, setQrTarget] = useState(null);

  useEffect(() => {
    fetchTables();
  }, []);

  async function fetchTables() {
    try {
      setLoading(true);
      const response = await api.get("/tables");
      // Show tables in a stable, predictable order for staff scanning
      // the floor, rather than whatever order the DB happens to return.
      const sorted = [...response.data].sort((a, b) => a.tableNumber - b.tableNumber);
      setTables(sorted);
    } catch (error) {
      console.error(error);
      showToast("Could not load tables", "error");
    } finally {
      setLoading(false);
    }
  }

  async function createTable(e) {
    e.preventDefault();
    const tableNumber = Number(newTableNumber);

    if (!tableNumber || tableNumber <= 0) {
      showToast("Enter a valid table number", "error");
      return;
    }

    setCreating(true);
    try {
      await api.post("/tables", { tableNumber });
      showToast(`Table ${tableNumber} added`);
      setNewTableNumber("");
      fetchTables();
    } catch (error) {
      console.error(error);
      const backendMessage = error?.response?.data?.message || error?.response?.data?.error;
      showToast(backendMessage || "Could not add table", "error");
    } finally {
      setCreating(false);
    }
  }

  async function cycleStatus(table) {
      const next = TABLE_STATUS_CYCLE[table.status] || "AVAILABLE";
      try {
        await api.patch(`/tables/${table.id}/status`, { status: next });
        fetchTables();
      } catch (error) {
        console.error(error);
        const backendMessage = error?.response?.data?.message || error?.response?.data?.error;
        showToast(backendMessage || "Could not update table status", "error");
      }
    }

  async function confirmDelete() {
    try {
      await api.delete(`/tables/${deleteTarget.id}`);
      showToast(`Table ${deleteTarget.tableNumber} removed`);
      setDeleteTarget(null);
      fetchTables();
    } catch (error) {
      console.error(error);
      showToast("Could not delete table", "error");
    }
  }

  async function copyLink(token) {
    try {
      await navigator.clipboard.writeText(customerUrlFor(token));
      showToast("Customer link copied");
    } catch (error) {
      showToast("Could not copy link", "error");
    }
  }

  return (
    <div style={css.page}>
      <PageHeader title="Tables" />

      <form onSubmit={createTable} style={css.inlineForm}>
        <input
          type="number"
          min="1"
          placeholder="Table number"
          value={newTableNumber}
          onChange={(e) => setNewTableNumber(e.target.value)}
          style={css.input}
        />
        <Button type="submit" loading={creating}>
          + Add Table
        </Button>
      </form>

      {loading ? (
        <div className="table-container">
          <table>
            <tbody>
              <TableSkeleton rows={3} columns={4} />
            </tbody>
          </table>
        </div>
      ) : tables.length === 0 ? (
        <EmptyState icon={<FaChair />} title="No tables yet." body="Add your first one above." />
      ) : (
        <div style={css.grid}>
          {tables.map((table) => {
            const meta = getTableStatusMeta(table.status);

            return (
              <Card key={table.id} className={`status-${meta.tone}`} style={css.tableCard}>
                <div style={css.cardTop}>
                  <span style={css.tableNumber}>Table {table.tableNumber}</span>
                  <StatusBadge status={table.status} label={meta.label} tone={meta.tone} />
                </div>

                <button
                  style={css.qrPreviewButton}
                  onClick={() => setQrTarget(table)}
                  title="View QR code"
                >
                  <img
                    src={qrImageUrlFor(table.token)}
                    alt={`QR code for table ${table.tableNumber}`}
                    style={css.qrThumb}
                  />
                  <span style={css.qrHint}>Tap to enlarge</span>
                </button>

                <div style={css.actions}>
                  <Button size="sm" variant="secondary" block onClick={() => cycleStatus(table)}>
                    Mark {TABLE_STATUS_CYCLE[table.status] || "AVAILABLE"}
                  </Button>

                  <Button size="sm" variant="secondary" block onClick={() => copyLink(table.token)}>
                    Copy Link
                  </Button>
                </div>

                <Button size="sm" variant="danger" block onClick={() => setDeleteTarget(table)}>
                  Delete
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Remove table"
        message={
          deleteTarget
            ? `Remove Table ${deleteTarget.tableNumber}? Its QR code will stop working immediately.`
            : ""
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Modal open={qrTarget !== null} onClose={() => setQrTarget(null)} title={qrTarget ? `Table ${qrTarget.tableNumber}` : ""}>
        {qrTarget && (
          <div style={css.qrModalBody}>
            <img
              src={qrImageUrlFor(qrTarget.token)}
              alt={`QR code for table ${qrTarget.tableNumber}`}
              style={css.qrLarge}
            />
            <p style={css.tokenText}>{qrTarget.token}</p>

            <div style={css.modalActions}>
              <Button size="sm" variant="secondary" onClick={() => copyLink(qrTarget.token)}>
                Copy Link
              </Button>
              <Button size="sm" variant="secondary" onClick={() => window.print()}>
                Print
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setQrTarget(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

const css = {
  page: { padding: 28, background: "var(--bg-page)", minHeight: "100vh" },
  inlineForm: { display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-6)" },
  input: {
    padding: "12px 16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)",
    fontSize: "var(--font-size-base)", background: "var(--bg-surface)", color: "var(--text-primary)",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--space-5)" },
  tableCard: { display: "flex", flexDirection: "column", gap: "var(--space-3)" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  tableNumber: { fontWeight: "var(--font-weight-bold)", fontSize: "var(--font-size-md)", color: "var(--text-primary)" },
  qrPreviewButton: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
    background: "var(--bg-surface)", border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-sm)", padding: "var(--space-3)", cursor: "pointer",
  },
  qrThumb: { width: 90, height: 90 },
  qrHint: { fontSize: "var(--font-size-xs)", color: "var(--text-muted)" },
  actions: {
    display: "flex",
    gap: "var(--space-2)",
    flexWrap: "wrap",
  },
  qrModalBody: { textAlign: "center" },
  qrLarge: { width: 220, height: 220 },
  tokenText: {
    fontFamily: "monospace", fontSize: "var(--font-size-xs)", color: "var(--text-muted)",
    wordBreak: "break-all", marginTop: "var(--space-3)",
  },
  modalActions: { display: "flex", gap: "var(--space-2)", marginTop: "var(--space-5)", justifyContent: "center" },
};

export default Tables;