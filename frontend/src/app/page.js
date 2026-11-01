"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="role-shell">
      <div className="role-container">
        <div className="bn-logo">BN</div>
        <div className="eyebrow">HYPERLOCAL FOOD DELIVERY</div>
        <h1>Behind <span>North Bangkok</span></h1>
        <p className="role-description">ระบบสั่งอาหารสำหรับโซนหลังมหาวิทยาลัย พร้อมระบบจัดการสำหรับลูกค้า ร้านค้า และแอดมิน</p>
        <div className="role-grid">
          <Link className="role-choice orange" href="/customer"><div className="role-choice-icon">🍔</div><div><h2>ลูกค้า</h2><p>ค้นหาร้าน สั่งอาหาร ติดตามออเดอร์</p></div><b>เข้าสู่ระบบ →</b></Link>
          <Link className="role-choice green" href="/merchant"><div className="role-choice-icon">🏪</div><div><h2>ร้านค้า</h2><p>จัดการออเดอร์ เมนู การจัดส่ง และแชท</p></div><b>เข้าสู่ระบบ →</b></Link>
          <Link className="role-choice blue" href="/admin"><div className="role-choice-icon">🛡️</div><div><h2>แอดมิน</h2><p>จัดการผู้ใช้ ร้านค้า ออเดอร์ และระบบ</p></div><b>เข้าสู่ระบบ →</b></Link>
        </div>
      </div>
    </main>
  );
}
