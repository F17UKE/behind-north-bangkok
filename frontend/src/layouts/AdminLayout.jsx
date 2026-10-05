import { NavLink, Outlet, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Store,
  ClipboardList,
  BarChart3,
  Ticket,
  ShieldCheck
} from "lucide-react";

const links = [
  ["/admin", "ภาพรวมระบบ", LayoutDashboard],
  ["/admin/users", "จัดการผู้ใช้", Users],
  ["/admin/stores", "จัดการร้านค้า", Store],
  ["/admin/orders", "จัดการออเดอร์", ClipboardList],
  ["/admin/reports", "รายงานและสถิติ", BarChart3],
  ["/admin/promotions", "คูปอง / โปรโมชั่น", Ticket]
];

export default function AdminLayout() {
  return (
    <div className="app-layout admin-theme">
      <aside className="side-nav admin-side">
        <Link to="/admin" className="side-brand">
          <ShieldCheck /> Behind NB Admin
        </Link>

        <div className="side-links">
          {links.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === "/admin"}>
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </div>
      </aside>

      <section className="content-area">
        <header className="desktop-header">
          <div>
            <strong>ระบบผู้ดูแล</strong>
            <span className="muted">
              จัดการผู้ใช้ ร้านค้า ออเดอร์ และรายงาน
            </span>
          </div>
          <div className="avatar admin-avatar">A</div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </section>
    </div>
  );
}