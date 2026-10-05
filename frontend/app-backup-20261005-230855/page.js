import Link from "next/link";

const roles = [
  {
    href: "/customer",
    title: "ลูกค้า",
    description: "ค้นหาร้าน สั่งอาหาร ชำระเงิน และติดตามออเดอร์",
    icon: "🍔",
    color: "orange"
  },
  {
    href: "/merchant",
    title: "ร้านค้า",
    description: "จัดการร้าน เมนู ออเดอร์ ลูกค้า และยอดขาย",
    icon: "🏪",
    color: "green"
  },
  {
    href: "/admin",
    title: "แอดมิน",
    description: "จัดการผู้ใช้ ร้านค้า ออเดอร์ โปรโมชั่น และระบบ",
    icon: "🛡️",
    color: "blue"
  }
];

export default function Home() {
  return (
    <main className="landing">
      <div className="landing-inner">
        <div className="brand-mark">BN</div>
        <p className="eyebrow">HYPERLOCAL FOOD DELIVERY</p>
        <h1>Behind <span>North Bangkok</span></h1>
        <p className="landing-sub">
          Web Application สำหรับสั่งอาหารโซนหลังมหาวิทยาลัย
          พร้อมระบบจัดการสำหรับลูกค้า ร้านค้า และแอดมิน
        </p>

        <div className="role-grid">
          {roles.map((role) => (
            <Link href={role.href} key={role.href} className={`role-card ${role.color}`}>
              <div className="role-icon">{role.icon}</div>
              <div>
                <h2>{role.title}</h2>
                <p>{role.description}</p>
              </div>
              <strong>เข้าสู่ระบบ →</strong>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}