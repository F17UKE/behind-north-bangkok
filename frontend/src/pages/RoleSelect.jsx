import { Link } from "react-router-dom";
import { ShoppingBag, Store, ShieldCheck } from "lucide-react";

const roles = [
  {
    to: "/customer",
    title: "ลูกค้า",
    desc: "ค้นหาร้าน สั่งอาหาร และติดตามออเดอร์",
    icon: ShoppingBag,
    cls: "orange"
  },
  {
    to: "/merchant",
    title: "ร้านค้า",
    desc: "จัดการออเดอร์ เมนู และยอดขาย",
    icon: Store,
    cls: "green"
  },
  {
    to: "/admin",
    title: "แอดมิน",
    desc: "จัดการผู้ใช้ ร้านค้า ระบบ และรายงาน",
    icon: ShieldCheck,
    cls: "blue"
  }
];

export default function RoleSelect() {
  return (
    <div className="role-page">
      <section className="hero">
        <span className="logo-mark">BN</span>
        <p className="eyebrow">HYPERLOCAL FOOD DELIVERY</p>
        <h1>
          Behind <span>North Bangkok</span>
        </h1>
        <p>
          ระบบสั่งอาหารสำหรับชาว มจพ.
          พร้อมพื้นที่จัดการแยกตามบทบาท
        </p>
      </section>

      <div className="role-grid">
        {roles.map(({ to, title, desc, icon: Icon, cls }) => (
          <Link className={`role-card ${cls}`} to={to} key={to}>
            <div className="role-icon">
              <Icon size={30} />
            </div>
            <div>
              <h2>{title}</h2>
              <p>{desc}</p>
            </div>
            <span>เข้าสู่ระบบ →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}