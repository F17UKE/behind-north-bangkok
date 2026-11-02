"use client";

export function MobileShell({ children, tone = "orange" }) {
  return <div className={`mobile-app ${tone}`}>{children}</div>;
}

export function TopBar({ title, subtitle, onBack, action }) {
  return (
    <header className="topbar">
      {onBack ? <button className="topbar-btn" onClick={onBack}>‹</button> : <div className="topbar-spacer" />}
      <div className="topbar-title"><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}</div>
      {action || <div className="topbar-spacer" />}
    </header>
  );
}

export function BottomNav({ items, active, onChange, tone = "orange" }) {
  return (
    <nav className={`bottom-nav ${tone}`}>
      {items.map((item) => (
        <button key={item.key} className={active === item.key ? "active" : ""} onClick={() => onChange(item.key)} style={{ position: "relative" }}>
          <span style={{ position: "relative", display: "inline-block" }}>
            {item.icon}
            {Number(item.badge) > 0 && (
              <span style={{
                position: "absolute",
                top: "-5px",
                right: "-12px",
                background: "#ef4444",
                color: "#ffffff",
                borderRadius: "10px",
                padding: "1px 5px",
                fontSize: "10px",
                fontWeight: 800,
                lineHeight: "12px",
                minWidth: "16px",
                textAlign: "center",
                boxShadow: "0 2px 5px rgba(239, 68, 68, 0.45)"
              }}>
                {item.badge}
              </span>
            )}
          </span>
          <small>{item.label}</small>
        </button>
      ))}
    </nav>
  );
}

export function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return <label className="search-bar"><span>⌕</span><input value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder} /></label>;
}

export function StatusPill({ children, tone = "orange" }) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}

export function EmptyState({ title, text }) {
  return <div className="empty-state"><div>🍽️</div><h3>{title}</h3><p>{text}</p></div>;
}
