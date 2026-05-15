export default function StatCard({ label, value, accent, icon }) {
  return (
    <div
      className="dash-stat-card"
      style={{
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: ".75rem",
        }}
      >
        <span
          style={{
            fontSize: ".75rem",
            fontWeight: 600,
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: ".05em",
          }}
        >
          {label}
        </span>

        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: `${accent}15`,
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
      </div>

      <div
        className="mono"
        style={{
          fontSize: "1.2rem",
          fontWeight: 700,
          color: accent,
          letterSpacing: "-.01em",
        }}
      >
        {value}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accent,
          borderRadius: "0 0 var(--radius) var(--radius)",
          opacity: 0.18,
        }}
      />
    </div>
  );
}
