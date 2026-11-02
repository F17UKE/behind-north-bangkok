import { NavLink, Outlet, Link } from "react-router-dom";
import {
  Home,
  Search,
  ClipboardList,
  MessageCircle,
  UserRound,
  ShoppingBag
} from "lucide-react";

export default function CustomerLayout() {
  return (
    <div className="customer-shell">
      <header className="mobile-topbar">
        <Link to="/customer" className="brand">
          Behind <span>NB</span>
        </Link>
        <Link to="/customer/cart" className="icon-btn">
          <ShoppingBag size={20} />
        </Link>
      </header>

      <main className="customer-main">
        <Outlet />
      </main>

      <nav className="customer-nav">
        <NavLink to="/customer" end>
          <Home size={20} />
          <span>หน้าแรก</span>
        </NavLink>
        <NavLink to="/customer">
          <Search size={20} />
          <span>ค้นหา</span>
        </NavLink>
        <NavLink to="/customer/orders">
          <ClipboardList size={20} />
          <span>ออเดอร์</span>
        </NavLink>
        <NavLink to="/customer/chat">
          <MessageCircle size={20} />
          <span>แชท</span>
        </NavLink>
        <NavLink to="/customer/profile">
          <UserRound size={20} />
          <span>โปรไฟล์</span>
        </NavLink>
      </nav>
    </div>
  );
}