// Skeleton blocks for the four dashboard stat cards while data loads.
export function StatCardSkeleton() {
  return (
    <div className="stat-card skeleton-card">
      <div className="skeleton skeleton-icon" />
      <div className="skeleton skeleton-line" style={{ width: "60%" }} />
      <div className="skeleton skeleton-line" style={{ width: "40%" }} />
    </div>
  );
}

// Skeleton rows for any table (Menu, Orders, Staff, Inventory) while
// data loads. `columns` controls how many <td> placeholders per row.
export function TableSkeleton({ rows = 4, columns = 4 }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex}>
              <div className="skeleton skeleton-line" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
