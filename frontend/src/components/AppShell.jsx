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
        <button key={item.key} className={active === item.key ? "active" : ""} onClick={() => onChange(item.key)}>
          <span>{item.icon}</span><small>{item.label}</small>
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
