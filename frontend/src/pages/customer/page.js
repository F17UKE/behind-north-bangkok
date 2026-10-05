"use client";

import { useState } from "react";
import Link from "next/link";

const stores = [
  { id: 1, name: "ครัวหลังมอ", category: "อาหารตามสั่ง", rating: "4.8", time: "15-25 นาที", open: true, emoji: "🍛" },
  { id: 2, name: "ข้าวมันไก่ลุงหนวด", category: "อาหารจานเดียว", rating: "4.7", time: "10-20 นาที", open: true, emoji: "🍚" },
  { id: 3, name: "ชานมหลังมหาลัย", category: "เครื่องดื่ม", rating: "4.6", time: "5-15 นาที", open: false, emoji: "🧋" }
];

const menu = [
  ["ข้าวกะเพราไก่", 45, "🌶️"],
  ["ข้าวไข่เจียว", 35, "🍳"],
  ["กะเพราหมูสับ", 45, "🥘"],
  ["ไข่ดาว", 10, "🍳"]
];

export default function Customer() {
  const [tab, setTab] = useState("home");
  const [cart, setCart] = useState(0);

  return (
    <main className="mobile-app">
      <header className="mobile-header">
        <Link href="/" className="brand">Behind <b>NB</b></Link>
        <Link href="#cart" className="circle-btn">🛍️</Link>
      </header>

      <div className="mobile-content">
        {tab === "home" && (
          <>
            <section className="customer-banner">
              <div>
                <small>BEHIND NB</small>
                <h1>หิวเมื่อไหร่<br/>สั่งร้านหลังมอได้เลย 🍜</h1>
                <p>อาหารใกล้มหาวิทยาลัย จัดส่งถึงคุณง่าย ๆ</p>
              </div>
              <span className="banner-emoji">🍛</span>
            </section>

            <div className="search">🔍 <input placeholder="ค้นหาร้าน หรือเมนูที่อยากกิน..." /></div>
            <div className="location">📍 หอพักมหาวิทยาลัย มจพ. <span>›</span></div>

            <div className="categories">
              {[
                ["🍛", "อาหารตามสั่ง"], ["🍚", "ข้าว"], ["🍟", "ของทอด"], ["🧋", "เครื่องดื่ม"]
              ].map(([icon, name]) => (
                <button key={name}><span>{icon}</span>{name}</button>
              ))}
            </div>

            <div className="section-head">
              <div><h2>ร้านแนะนำ</h2><p>ร้านยอดนิยมใกล้คุณ</p></div>
              <button>ดูทั้งหมด</button>
            </div>

            <div className="store-list">
              {stores.map((s) => (
                <div className="store-card" key={s.id}>
                  <div className="store-image">{s.emoji}</div>
                  <div className="store-body">
                    <div className="between"><h3>{s.name}</h3><span className={s.open ? "open" : "closed"}>{s.open ? "เปิด" : "ปิด"}</span></div>
                    <p>{s.category}</p>
                    <div className="meta">⭐ {s.rating} &nbsp; · &nbsp; ⏱️ {s.time}</div>
                    {s.open && (
                      <button className="orange-btn" onClick={() => { setTab("store"); setCart(0); }}>
                        ดูเมนู
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "store" && (
          <>
            <button className="back-btn" onClick={() => setTab("home")}>← กลับ</button>
            <div className="store-cover">🍛</div>
            <div className="store-title">
              <div><h1>ครัวหลังมอ</h1><p>อาหารตามสั่ง · ⭐ 4.8 · 15-25 นาที</p></div>
              <span className="open">เปิด</span>
            </div>
            <div className="pill-tabs"><button className="active">เมนู</button><button>รีวิว</button><button>ข้อมูลร้าน</button></div>

            <div className="section-head"><div><h2>เมนู</h2><p>อาหารราคานักศึกษา</p></div></div>
            {menu.map(([name, price, emoji], i) => (
              <div className="menu-row" key={name}>
                <div className="menu-pic">{emoji}</div>
                <div className="menu-info"><h3>{name}</h3><strong>{price} บาท</strong><small>พร้อมขาย</small></div>
                <button className="plus" onClick={() => setCart((x) => x + 1)}>+</button>
              </div>
            ))}
            <button className="cart-bar" onClick={() => setTab("cart")}>🛍️ ดูตะกร้า <span>{cart} รายการ · {cart ? 90 : 0} บาท</span></button>
          </>
        )}

        {tab === "cart" && (
          <>
            <button className="back-btn" onClick={() => setTab("store")}>← กลับ</button>
            <div className="section-head"><div><h1>ตะกร้าของฉัน</h1><p>ครัวหลังมอ</p></div></div>
            <div className="white-card">
              <div className="cart-item"><div><b>ข้าวกะเพราไก่</b><small>45 บาท</small></div><div className="qty">− &nbsp; 1 &nbsp; +</div></div>
              <div className="cart-item"><div><b>ข้าวไข่เจียว</b><small>35 บาท</small></div><div className="qty">− &nbsp; 1 &nbsp; +</div></div>
            </div>
            <div className="white-card address">📍 <div><small>จัดส่งที่</small><b>หอพักมหาวิทยาลัย มจพ.</b><span>รายละเอียดที่อยู่จัดส่งของคุณ</span></div><button>เปลี่ยน</button></div>
            <div className="white-card summary"><div>ค่าอาหาร <b>80 บาท</b></div><div>ค่าจัดส่ง <b>10 บาท</b></div><hr/><div className="total">รวมทั้งหมด <strong>90 บาท</strong></div></div>
            <button className="orange-btn full" onClick={() => setTab("orders")}>สั่งอาหาร 90 บาท</button>
          </>
        )}

        {tab === "orders" && (
          <>
            <div className="section-head"><div><small className="eyebrow">ORDER #ORD001</small><h1>ติดตามคำสั่งซื้อ</h1></div><span className="status-orange">กำลังทำอาหาร</span></div>
            <div className="timeline">
              {[["✓","รับคำสั่งซื้อแล้ว","ร้านได้รับคำสั่งซื้อของคุณ"],["🍳","กำลังทำอาหาร","คาดว่าจะเสร็จใน 10 นาที"],["🛵","รอรับอาหาร","ไรเดอร์กำลังเดินทาง"],["✓","เสร็จสิ้น","รับประทานอาหารให้อร่อย"]].map(([icon,t,d],i)=><div className={`step ${i<2?"active":""}`} key={t}><b>{icon}</b><div><strong>{t}</strong><p>{d}</p></div></div>)}
            </div>
            <div className="white-card"><h3>รายละเอียดคำสั่งซื้อ</h3><p>#ORD001 · ครัวหลังมอ</p><div className="summary-line">ข้าวกะเพราไก่ x1 <b>45 บาท</b></div><div className="summary-line">ข้าวไข่เจียว x1 <b>35 บาท</b></div><div className="summary-line">ค่าจัดส่ง <b>10 บาท</b></div><hr/><div className="summary-line total">รวม <strong>90 บาท</strong></div></div>
            <button className="secondary-btn full">💬 แชทร้านค้า</button>
          </>
        )}

        {tab === "profile" && (
          <>
            <div className="profile"><div className="profile-avatar">👤</div><div><h1>นักศึกษา มจพ.</h1><p>098-765-4321</p></div></div>
            <div className="white-card profile-menu">
              {["📍 ที่อยู่ในการจัดส่ง","📋 รายการคำสั่งซื้อ","♡ รายการโปรด","🎟️ คูปอง / ส่วนลด","⚙️ ตั้งค่า"].map((x)=><button key={x}>{x}<span>›</span></button>)}
            </div>
            <button className="logout">↪ ออกจากระบบ</button>
          </>
        )}
      </div>

      <nav className="bottom-nav">
        <button className={tab==="home"?"active":""} onClick={() => setTab("home")}>⌂<small>หน้าแรก</small></button>
        <button onClick={() => setTab("store")}>⌕<small>ค้นหา</small></button>
        <button className={tab==="orders"?"active":""} onClick={() => setTab("orders")}>▣<small>ออเดอร์</small></button>
        <button>💬<small>แชท</small></button>
        <button className={tab==="profile"?"active":""} onClick={() => setTab("profile")}>♙<small>โปรไฟล์</small></button>
      </nav>
    </main>
  );
}