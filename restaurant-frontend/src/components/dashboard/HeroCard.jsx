export default function HeroCard({
  title,
  value,
  subtitle,
  color,
  icon,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#ffffff",
        borderRadius: 18,
        padding: "18px 20px",
        border: "1px solid #e2e8f0",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: 145,
        transition: "all .2s ease",
        boxShadow: "0 4px 12px rgba(15,23,42,.04)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow =
          "0 12px 30px rgba(15,23,42,.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow =
          "0 4px 12px rgba(15,23,42,.04)";
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#64748b",
              marginBottom: 6,
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1,
            }}
          >
            {value}
          </div>
        </div>

        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 14,
            background: `${color}15`,
            color,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: 24,
          }}
        >
          {icon}
        </div>
      </div>

      <div
        style={{
          fontSize: 13,
          color: "#94a3b8",
          fontWeight: 500,
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}