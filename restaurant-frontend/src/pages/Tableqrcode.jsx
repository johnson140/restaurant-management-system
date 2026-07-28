import { QRCodeSVG } from "qrcode.react";

// Pass in the table object returned from your backend, e.g. { id, tableNumber, token, status }
// customerAppBaseUrl = the URL where your customer-facing ordering page is hosted
export default function TableQRCode({ table, customerAppBaseUrl }) {
  const orderingUrl = `${customerAppBaseUrl}/?token=${table.token}`;

  return (
    <div style={{ textAlign: "center", padding: "16px" }}>
      <h3>Table {table.tableNumber}</h3>

      <QRCodeSVG
        value={orderingUrl}
        size={200}
        level="H" // high error correction, survives print smudges/creases
      />

      <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
        {orderingUrl}
      </p>

      <button onClick={() => window.print()}>Print QR Code</button>
    </div>
  );
}
