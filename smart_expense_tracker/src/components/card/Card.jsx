export default function StatCard({ label, value, accent, icon, negative = false }) {
  return (
    <div className="dash-stat-card">
      <div className="stat-card__head">
        <span className="stat-card__label">{label}</span>
        <span
          className="stat-card__icon"
          style={{ color: accent, background: `${accent}14` }}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <div
        className="stat-card__value mono"
        style={negative ? { color: "var(--expense)" } : undefined}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}
