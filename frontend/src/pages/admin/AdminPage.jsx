"use client";

import { useMemo, useState } from "react";
import { BottomNav, MobileShell, SearchBar, StatusPill, TopBar, EmptyState } from "../../components/AppShell";
import { adminUsers, statusLabel } from "../../data/mockData";

export default function AdminPage() {
  const [screen, setScreen] = useState("home");
  const [users, setUsers] = useState(adminUsers);
  const [selectedUser, setSelectedUser] = useState(adminUsers[0]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [notice, setNotice] = useState(0);

  const filtered = useMemo(()=>users.filter((u)=>{
    const q=`${u.name} ${u.phone} ${u.role}`.toLowerCase();
    if(!q.includes(query.toLowerCase())) return false;
    if(tab === "user") return u.role === "User";
    if(tab === "merchant") return u.role === "Merchant";
    return true;
  }),[users,query,tab]);

  const changeStatus=(status)=>{ setUsers((all)=>all.map((u)=>u.id===selectedUser.id?{...u,status}:u)); setSelectedUser((u)=>({...u,status})); };

  return <MobileShell tone="admin"><div className="admin-page">
    {screen === "home" && <AdminHome notice={notice} go={setScreen} />}
    {screen === "users" && <AdminUsers users={filtered} query={query} setQuery={setQuery} tab={tab} setTab={setTab} onBack={()=>setScreen("home")} onOpen={(u)=>{setSelectedUser(u);setScreen("detail");}} />}
    {screen === "detail" && <AdminDetail user={selectedUser} onBack={()=>setScreen("users")} onChangeStatus={changeStatus} />}
    {screen === "more" && <AdminMore onBack={()=>setScreen("home")} />}
    {screen === "notice" && <AdminNotice onBack={()=>setScreen("home")} />}
    <BottomNav tone="admin" active={screen} onChange={(key)=>setScreen(key)} items={[{key:"home",label:"Home",icon:"⌂"},{key:"users",label:"User",icon:"♙"},{key:"notice",label:"Notice",icon:"●"},{key:"more",label:"More",icon:"•••"}]} />
  </div></MobileShell>;
}

function AdminHome({ go }) {
  return <><div className="admin-header"><div className="avatar peach">👤</div><div><b>แอดมินครัวหลังมอ</b><small>Admin</small></div><button>⌕</button></div><div className="admin-stats"><div><b>24</b><small>Order Today</small><em>+XX%</em></div><div><b>1,560</b><small>Revenue Today</small><em>+XX%</em></div><div><b>86</b><small>Total Shop</small><em>+XX%</em></div><div><b>1,254</b><small>Total User</small><em>+XX%</em></div></div><div className="sales-card"><div className="sales-head"><b>Sale Revenue</b><span>View</span></div><div className="chart">{[30,42,35,50,43,64,58,76,62,84].map((h,i)=><i key={i} style={{height:`${h}%`}} />)}</div><small>9/9　10/9　11/9　12/9　13/9</small></div><button className="admin-action-card" onClick={()=>go("users")}><span>👤</span><div><b>Manage Users</b><small>User / Merchant ผู้ใช้งาน</small></div><strong>›</strong></button><button className="admin-action-card" onClick={()=>go("notice")}><span>🔔</span><div><b>Notices</b><small>แจ้งเตือนและ Support</small></div><strong>›</strong></button></>;
}
function AdminUsers({ users, query, setQuery, tab, setTab, onBack, onOpen }) { return <><TopBar title="User/Merchant ผู้ใช้งาน" subtitle="จัดการผู้ใช้งาน" onBack={onBack} action={<button className="topbar-btn">⋯</button>} /><SearchBar value={query} onChange={setQuery} placeholder="Search..." /><div className="filter-scroll"><button className={tab==="all"?"active":""} onClick={()=>setTab("all")}>All</button><button className={tab==="user"?"active":""} onClick={()=>setTab("user")}>User</button><button className={tab==="merchant"?"active":""} onClick={()=>setTab("merchant")}>Merchant</button></div>{users.length?users.map((u)=><button className="admin-user-row" key={u.id} onClick={()=>onOpen(u)}><div className="avatar small">👤</div><div><b>{u.name}</b><small>{u.phone}</small></div><span>{u.role}</span><small>{u.status}</small></button>):<EmptyState title="No users" text="ไม่พบข้อมูลผู้ใช้งาน" />}</>; }
function AdminDetail({ user, onBack, onChangeStatus }) { return <><div className="admin-detail-head"><button onClick={onBack}>‹</button><b>User Detail ประวัติผู้ใช้งาน</b></div><div className="detail-profile"><div className="detail-avatar">👨</div><div><h2>{user.name}</h2><span className="green-text">● {user.status}</span></div></div><div className="detail-contact"><div>☎ Tel. {user.phone}</div><div>✉ mutty@example.com</div><div>📍 หอพักหลังมอ มจพ.</div></div><div className="detail-stats"><div><b>20</b><small>จำนวนออเดอร์</small></div><div><b>XX</b><small>ยอดใช้จ่ายรวม</small></div></div><div className="detail-buttons"><button onClick={()=>onChangeStatus("active")}>เปิดใช้งาน</button><button>ส่งข้อความ</button><button>ระงับบัญชี</button><button className="danger-filled" onClick={()=>onChangeStatus("blocked")}>บล็อกบัญชี</button></div></>; }
function AdminMore({ onBack }) { return <><TopBar title="Setting การตั้งค่า" onBack={onBack} /><div className="setting-profile"><div className="detail-avatar">👤</div><div><b>แอดมินครัวหลังมอ</b><small>Admin</small></div></div>{["ข้อมูลส่วนตัว","เปลี่ยนรหัสผ่าน","การแจ้งเตือน","ภาษา","เกี่ยวกับระบบ"].map((x)=><button className="setting-row" key={x}>{x}<span>›</span></button>)}<button className="logout-admin">ออกจากระบบ</button></>; }
function AdminNotice({ onBack }) { return <><TopBar title="Notice" subtitle="Support" onBack={onBack} /><div className="notice-card"><b>Support</b><small>ระบบช่วยเหลือ</small><p>มีข้อความจากร้านค้า 3 รายการที่รอการตอบกลับ</p><button className="primary-btn">Open Support</button></div><div className="notice-card"><b>Order Alert</b><small>ระบบออเดอร์</small><p>มีออเดอร์ที่กำลังดำเนินการ 18 รายการ</p></div></>; }
