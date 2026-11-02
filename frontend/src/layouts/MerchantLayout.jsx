import { NavLink, Outlet, Link } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Utensils,
  BarChart3,
  MessageCircle,
  Settings,
  Store
} from "lucide-react";

const links = [
  ["/merchant", "แดชบอร์ด", LayoutDashboard],
  ["/merchant/orders", "ออเดอร์", ClipboardList],
  ["/merchant/menu", "จัดการเมนู", Utensils],
  ["/merchant/reports", "รายงาน", BarChart3],
  ["/merchant/chat", "แชทลูกค้า", MessageCircle],
  ["/merchant/settings", "ตั้งค่าร้าน", Settings]
];

export default function MerchantLayout() {
  return (
    <div className="app-layout">
      <aside className="side-nav merchant-side">
        <Link to="/merchant" className="side-brand">
          <Store /> Behind NB
        </Link>

        <div className="side-store">
          ครัวหลังมอ
          <small>ร้านค้า</small>
        </div>

        <div className="side-links">
          {links.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === "/merchant"}>
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </div>
      </aside>

      <section className="content-area">
        <header className="desktop-header">
          <div>
            <strong>ศูนย์จัดการร้านค้า</strong>
            <span className="muted">จัดการร้าน เมนู และคำสั่งซื้อ</span>
          </div>
          <div className="avatar">ค</div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </section>
    </div>
  );
}