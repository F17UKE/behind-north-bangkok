"use client";

import Link from "next/link";
import { useState } from "react";

const menu = [
  ["dashboard","▦","ภาพรวมระบบ"],
  ["users","♙","จัดการผู้ใช้"],
  ["stores","🏪","จัดการร้านค้า"],
  ["orders","▣","จัดการออเดอร์"],
  ["reports","◫","รายงานและสถิติ"],
  ["promos","🎟️","คูปอง / โปรโมชั่น"]
];

const users = [
  ["นักศึกษา มจพ.","098-765-4321","ลูกค้า","ใช้งาน"],
  ["Petchtae","081-222-3333","ร้านค้า","ใช้งาน"],
  ["Thanakrit","081-333-4444","ลูกค้า","ระงับ"],
  ["Napat","082-444-5555","ลูกค้า","ใช้งาน"]
];

const stores = [
  ["ครัวหลังมอ","อาหารตามสั่ง","เปิด","4.8"],
  ["ข้าวมันไก่ลุงหนวด","อาหารจานเดียว","เปิด","4.7"],
  ["ชานมหลังมหาลัย","เครื่องดื่ม","ปิด","4.6"],
  ["ร้านป้าแก้ว","อาหารตามสั่ง","รอตรวจสอบ","-"]
];

export default function Admin(){
 const [tab,setTab]=useState("dashboard");
 return <main className="dashboard admin">
  <aside className="side admin-side"><Link href="/" className="side-logo blue">🛡 Behind NB Admin</Link>{menu.map(x=><button key={x[0]} className={tab===x[0]?"side-link active blue-active":"side-link"} onClick={()=>setTab(x[0])}>{x[1]}{x[2]}</button>)}</aside>
  <section className="dash-content"><header className="dash-head"><div><b>ระบบผู้ดูแล</b><small>จัดการผู้ใช้ ร้านค้า ออเดอร์ และรายงาน</small></div><div className="avatar blue-avatar">A</div></header><div className="dash-body">
    {tab==="dashboard"&&<AdminDashboard/>}
    {tab==="users"&&<AdminUsers/>}
    {tab==="stores"&&<AdminStores/>}
    {tab==="orders"&&<AdminOrders/>}
    {tab==="reports"&&<AdminReports/>}
    {tab==="promos"&&<AdminPromos/>}
  </div></section>
 </main>
}
function Card({title,children}){return <section className="dash-card"><h3>{title}</h3>{children}</section>}
function Stats(){return <div className="stats">{[["👥","ผู้ใช้ทั้งหมด","1,254","+5%"],["🏪","ร้านค้าทั้งหมด","86","+3 ร้าน"],["📋","ออเดอร์ทั้งหมด","432","+18 วันนี้"],["💰","รายได้รวม","28,560 บาท","+12%"]].map(x=><div className="stat" key={x[1]}><span>{x[0]}</span><div><small>{x[1]}</small><strong>{x[2]}</strong><em>{x[3]}</em></div></div>)}</div>}
function AdminDashboard(){return <><div className="page-title"><h1>ภาพรวมระบบ</h1><p>ข้อมูลสำคัญของ Behind NB วันนี้</p></div><Stats/><div className="two-panels"><Card title="จำนวนออเดอร์ 7 วัน"><div className="bars large">{[36,55,44,78,61,89,70].map((h,i)=><div key={i} style={{height:h+"%"}}><small>{10+i}/9</small></div>)}</div></Card><Card title="ออเดอร์ล่าสุด">{["#ORD001 · ครัวหลังมอ · กำลังทำอาหาร","#ORD002 · ครัวหลังมอ · รอรับออเดอร์","#ORD003 · ข้าวมันไก่ลุงหนวด · เสร็จสิ้น"].map(x=><div className="simple-row" key={x}>{x}</div>)}</Card></div></>}
function AdminUsers(){return <TablePage title="จัดการผู้ใช้" subtitle="จัดการบัญชีลูกค้า ร้านค้า และแอดมิน" headers={["ชื่อ","เบอร์โทร","บทบาท","สถานะ",""]} rows={users}/>}
function AdminStores(){return <TablePage title="จัดการร้านค้า" subtitle="ตรวจสอบร้านและสถานะการเปิดให้บริการ" headers={["ชื่อร้าน","ประเภท","สถานะ","คะแนน",""]} rows={stores}/>}
function AdminOrders(){return <TablePage title="จัดการออเดอร์" subtitle="ตรวจสอบและช่วยเหลือคำสั่งซื้อทั้งหมดในระบบ" headers={["Order ID","ลูกค้า","ร้านค้า","ยอดรวม","สถานะ"]} rows={[["#ORD001","นักศึกษา มจพ.","ครัวหลังมอ","90 บาท","กำลังทำอาหาร"],["#ORD002","Petchtae","ครัวหลังมอ","75 บาท","รอรับออเดอร์"],["#ORD003","Thanakrit","ข้าวมันไก่ลุงหนวด","120 บาท","เสร็จสิ้น"]]}/>}
function TablePage({title,subtitle,headers,rows}){return <><div className="page-title"><h1>{title}</h1><p>{subtitle}</p></div><div className="toolbar"><input placeholder="🔍 ค้นหา..."/><select><option>ทั้งหมด</option><option>เปิด</option><option>ปิด</option></select><button className="primary">＋ เพิ่มรายการ</button></div><div className="table-wrap"><table><thead><tr>{headers.map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((x,j)=><td key={j}>{j===3&&title==="จัดการผู้ใช้"?<span className={x==="ใช้งาน"?"status-green":"status-red"}>{x}</span>:x}</td>)}</tr>)}</tbody></table></div></>}
function AdminReports(){return <><div className="page-title"><h1>รายงานและสถิติ</h1><p>วิเคราะห์ภาพรวมแพลตฟอร์ม</p></div><Stats/><Card title="ออเดอร์ต่อวัน"><div className="bars large">{[30,48,52,63,42,74,88].map((h,i)=><div key={i} style={{height:h+"%"}}><small>{10+i}/9</small></div>)}</div></Card></>}
function AdminPromos(){return <><div className="page-title between"><div><h1>คูปอง / โปรโมชั่น</h1><p>สร้างและจัดการสิทธิประโยชน์สำหรับลูกค้า</p></div><button className="primary">＋ เพิ่มคูปอง</button></div><div className="promo-grid">{[["WELCOME10","ลด 10%","เปิด"],["STUDENT20","ลด 20 บาท","เปิด"],["NEWSTORE","ลด 15%","ปิด"]].map(x=><div className="promo-card" key={x[0]}><span>🎟️</span><div><b>{x[0]}</b><p>{x[1]}</p></div><strong className={x[2]==="เปิด"?"status-green":"status-gray"}>{x[2]}</strong></div>)}</div></>}
