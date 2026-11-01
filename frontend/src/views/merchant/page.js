"use client";

import Link from "next/link";
import { useState } from "react";

const orders = [
  ["#ORD001", "นักศึกษา มจพ.", "กำลังทำอาหาร", "90 บาท"],
  ["#ORD002", "Petchtae", "รอรับออเดอร์", "75 บาท"],
  ["#ORD003", "Thanakrit", "เสร็จสิ้น", "120 บาท"]
];

const menu = [["ข้าวกะเพราไก่",45,true],["ข้าวไข่เจียว",35,true],["กะเพราหมูสับ",45,false],["ไข่ดาว",10,true]];

export default function Merchant() {
  const [tab, setTab] = useState("dashboard");
  return (
    <main className="dashboard">
      <aside className="side">
        <Link href="/" className="side-logo">🍔 Behind NB</Link>
        <div className="shop-card"><b>ครัวหลังมอ</b><small>● เปิดร้าน</small></div>
        {[
          ["dashboard","▦","แดชบอร์ด"],["orders","▣","ออเดอร์"],["menu","🍴","จัดการเมนู"],["reports","◫","รายงาน"],["chat","💬","แชทลูกค้า"],["settings","⚙","ตั้งค่าร้าน"]
        ].map(([key,icon,label])=><button className={tab===key?"side-link active":"side-link"} onClick={()=>setTab(key)} key={key}>{icon}{label}</button>)}
      </aside>
      <section className="dash-content">
        <header className="dash-head"><div><b>ศูนย์จัดการร้านค้า</b><small>จัดการร้าน เมนู และคำสั่งซื้อ</small></div><div className="avatar">ค</div></header>
        <div className="dash-body">
          {tab==="dashboard" && <MerchantDashboard/>}
          {tab==="orders" && <MerchantOrders/>}
          {tab==="menu" && <MerchantMenu menu={menu}/>}
          {tab==="reports" && <MerchantReports/>}
          {tab==="chat" && <MerchantChat/>}
          {tab==="settings" && <MerchantSettings/>}
        </div>
      </section>
    </main>
  );
}

function Card({title,children}){return <section className="dash-card"><h3>{title}</h3>{children}</section>}
function MerchantDashboard(){
 return <><div className="page-title"><div><h1>สวัสดี 👋 ครัวหลังมอ</h1><p>ภาพรวมร้านค้าของคุณวันนี้</p></div></div>
 <div className="stats">{[["📋","ออเดอร์วันนี้","24","+5 จากเมื่อวาน"],["💰","รายได้วันนี้","1,560 บาท","+12%"],["⏱","เวลาเฉลี่ย / ออเดอร์","14 นาที","ดีขึ้น 2 นาที"],["⭐","คะแนนร้าน","4.8 / 5","120 รีวิว"]].map(x=><div className="stat" key={x[1]}><span>{x[0]}</span><div><small>{x[1]}</small><strong>{x[2]}</strong><em>{x[3]}</em></div></div>)}</div>
 <div className="two-panels"><Card title="ออเดอร์ล่าสุด">{orders.map(o=><div className="order-line" key={o[0]}><div><b>{o[0]}</b><small>{o[1]}</small></div><div><span className="status">{o[2]}</span><b>{o[3]}</b></div></div>)}</Card><Card title="ยอดขาย 7 วัน"><div className="bars">{[35,52,44,72,60,87,68].map((h,i)=><div key={i} style={{height:h+"%"}}><small>{i+9}</small></div>)}</div></Card></div></>
}
function MerchantOrders(){
 return <><div className="page-title"><h1>จัดการออเดอร์</h1><p>รับออเดอร์และอัปเดตสถานะให้ลูกค้า</p></div><div className="filters"><button className="active">รอรับ (3)</button><button>กำลังทำ</button><button>เสร็จสิ้น</button></div>{orders.map(o=><div className="large-order" key={o[0]}><div className="between"><div><b>{o[0]}</b><p>{o[1]} · 10:25</p></div><span className="status">{o[2]}</span></div><div className="between line"><div><p>ข้าวกะเพราไก่ x1</p><p>ข้าวไข่เจียว x1</p></div><b>{o[3]}</b></div><div className="actions"><button>✕ ปฏิเสธ</button><button className="accept">✓ รับออเดอร์</button></div></div>)}</>
}
function MerchantMenu({menu}){return <><div className="page-title between"><div><h1>จัดการเมนู</h1><p>เปิด-ปิดเมนูและแก้ไขราคา</p></div><button className="primary">＋ เพิ่มเมนู</button></div>{menu.map(x=><div className="menu-admin" key={x[0]}><span>{x[0][0]}</span><div><b>{x[0]}</b><small>{x[1]} บาท</small></div><label className="switch"><input type="checkbox" defaultChecked={x[2]}/><i/></label><button>•••</button></div>)}</>}
function MerchantReports(){return <><div className="page-title"><h1>รายงานรายได้</h1><p>ดูยอดขายและประสิทธิภาพร้านค้า</p></div><div className="stats three">{[["💰","รายได้รวม","1,560 บาท","+12%"],["🛍️","ออเดอร์ทั้งหมด","24","+5"],["📈","ค่าเฉลี่ย / ออเดอร์","65 บาท","ทรงตัว"]].map(x=><div className="stat" key={x[1]}><span>{x[0]}</span><div><small>{x[1]}</small><strong>{x[2]}</strong><em>{x[3]}</em></div></div>)}</div><Card title="ยอดขายรายชั่วโมง"><div className="bars large">{[24,40,32,58,64,80,50,70,92,77].map((h,i)=><div key={i} style={{height:h+"%"}}><small>{9+i}</small></div>)}</div></Card></>}
function MerchantChat(){return <div className="chat-box"><aside><input placeholder="ค้นหาชื่อออเดอร์..."/>{["นักศึกษา มจพ.","Petchtae","Thanakrit","Napat"].map(x=><div className="contact" key={x}>👤 <b>{x}</b></div>)}</aside><section><div className="chat-top"><b>นักศึกษา มจพ.</b><small>#ORD001</small></div><div className="messages"><p>ออเดอร์เรียบร้อยแล้วครับ</p><p className="me">ขอบคุณครับ</p><p>อาหารเสร็จแล้ว สามารถมารับได้เลยครับ</p></div><div className="message-input"><input placeholder="พิมพ์ข้อความ..."/><button>➤</button></div></section></div>}
function MerchantSettings(){return <><div className="page-title"><h1>ตั้งค่าร้าน</h1><p>ข้อมูลที่ลูกค้าจะเห็น</p></div><Card title="ข้อมูลร้าน"><div className="form"><label>ชื่อร้าน<input defaultValue="ครัวหลังมอ"/></label><label>ประเภทร้าน<input defaultValue="อาหารตามสั่ง"/></label><label>รายละเอียด<input defaultValue="อาหารตามสั่ง ราคานักศึกษา"/></label><div className="row"><label>เวลาเปิด<input defaultValue="08:00"/></label><label>เวลาปิด<input defaultValue="21:00"/></label></div><label>ที่อยู่ร้าน<input defaultValue="หลังมหาวิทยาลัย มจพ."/></label><button className="primary">บันทึกการเปลี่ยนแปลง</button></div></Card></>}
