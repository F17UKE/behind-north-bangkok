export default function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon size={20} />
      </div>
      <div>
        <p className="stat-label">{label}</p>
        <h3>{value}</h3>
        {hint && <span className="stat-hint">{hint}</span>}
      </div>
    </div>
  );
}