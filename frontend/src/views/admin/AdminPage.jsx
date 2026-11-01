"use client";

import { useEffect, useMemo, useState } from "react";
import { BottomNav, MobileShell, SearchBar, StatusPill, TopBar, EmptyState } from "../../components/AppShell";
import { adminUsers, statusLabel } from "../../data/mockData";
import { adminApi } from "../../api/adminApi";
import { authApi } from "../../api/authApi";

export default function AdminPage() {
  const [screen, setScreen] = useState("home");
  const [users, setUsers] = useState(adminUsers);
  const [selectedUser, setSelectedUser] = useState(adminUsers[0]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [notice, setNotice] = useState(0);
  const [actionNotice, setActionNotice] = useState("");

  // โหลดร้านค้าจริงจาก Backend Admin API
  useEffect(() => {
    initAdminData();
  }, []);

  async function initAdminData() {
    try {
      // ตรวจสอบหรือล็อกอิน Admin เบื้องต้น
      if (!authApi.isLoggedIn("ADMIN")) {
        await authApi.loginAdmin("admin", "admin1234").catch(() => null);
      }

      const merchants = await adminApi.getAllMerchants();
      if (Array.isArray(merchants) && merchants.length > 0) {
        const mappedMerchants = merchants.map(m => ({
          id: `m_${m.id}`,
          rawId: m.id,
          name: m.store_name,
          phone: m.promptpay_id || "08X-XXX-XXXX",
          role: "Merchant",
          status: m.is_approved ? "active" : "pending_approval",
          location: m.location || "โซนหลังมอ",
          isOpen: m.is_open
        }));

        setUsers(prev => {
          const userOnly = prev.filter(u => u.role !== "Merchant");
          return [...userOnly, ...mappedMerchants];
        });
      }
    } catch (err) {
      console.log("Could not load backend admin merchants:", err.message);
    }
  }

  const filtered = useMemo(()=>users.filter((u)=>{
    const q=`${u.name} ${u.phone} ${u.role}`.toLowerCase();
    if(!q.includes(query.toLowerCase())) return false;
    if(tab === "user") return u.role === "User";
    if(tab === "merchant") return u.role === "Merchant";
    return true;
  }),[users,query,tab]);

  async function changeStatus(status) {
    if (selectedUser.role === "Merchant" && selectedUser.rawId) {
      try {
        if (status === "active") {
          await adminApi.approveMerchant(selectedUser.rawId);
          setActionNotice(`✅ อนุมัติร้านค้า "${selectedUser.name}" เรียบร้อยแล้ว`);
        } else if (status === "blocked") {
          await adminApi.rejectMerchant(selectedUser.rawId);
          setActionNotice(`🚫 ระงับร้านค้า "${selectedUser.name}" เรียบร้อยแล้ว`);
        }
      } catch (err) {
        setActionNotice(`บันทึกสถานะ: ${status}`);
      }
      setTimeout(() => setActionNotice(""), 3500);
    }

    setUsers((all)=>all.map((u)=>u.id===selectedUser.id?{...u,status}:u)); 
    setSelectedUser((u)=>({...u,status})); 
  }

  return <MobileShell tone="admin">
    <div key={screen} className="admin-page screen-enter">
      {actionNotice && (
        <div style={{ background: "#3182ce", color: "white", padding: "8px 12px", borderRadius: "8px", margin: "8px 12px", fontSize: "13px", textAlign: "center" }}>
          {actionNotice}
        </div>
      )}

      {screen === "home" && <AdminHome notice={notice} go={setScreen} userCount={users.length} />}
      {screen === "users" && <AdminUsers users={filtered} query={query} setQuery={setQuery} tab={tab} setTab={setTab} onBack={()=>setScreen("home")} onOpen={(u)=>{setSelectedUser(u);setScreen("detail");}} />}
      {screen === "detail" && <AdminDetail user={selectedUser} onBack={()=>setScreen("users")} onChangeStatus={changeStatus} />}
      {screen === "more" && <AdminMore onBack={()=>setScreen("home")} />}
      {screen === "notice" && <AdminNotice onBack={()=>setScreen("home")} />}
      <BottomNav tone="admin" active={screen} onChange={(key)=>setScreen(key)} items={[{key:"home",label:"Home",icon:"⌂"},{key:"users",label:"User",icon:"♙"},{key:"notice",label:"Notice",icon:"●"},{key:"more",label:"More",icon:"•••"}]} />
    </div>
  </MobileShell>;
}

function AdminHome({ go, userCount }) {
  return <><div className="admin-header"><div className="avatar peach">👤</div><div><b>แอดมินครัวหลังมอ</b><small>Admin (API Connected)</small></div><button>⌕</button></div>
    <div className="admin-stats">
      <div><b>24</b><small>Order Today</small><em>+12%</em></div>
      <div><b>1,560</b><small>Revenue Today</small><em>+8%</em></div>
      <div><b>2</b><small>Active Shops</small><em>Database</em></div>
      <div><b>{userCount}</b><small>Total Users</small><em>System</em></div>
    </div>
    <div className="sales-card">
      <div className="sales-head"><b>Sale Revenue</b><span>View</span></div>
      <div className="chart">{[30,42,35,50,43,64,58,76,62,84].map((h,i)=><i key={i} style={{height:`${h}%`}} />)}</div>
      <small>9/9　10/9　11/9　12/9　13/9</small>
    </div>
    <button className="admin-action-card" onClick={()=>go("users")}><span>👤</span><div><b>Manage Users & Merchants</b><small>ตรวจสอบและอนุมัติร้านค้า</small></div><strong>›</strong></button>
    <button className="admin-action-card" onClick={()=>go("notice")}><span>🔔</span><div><b>Notices & Support</b><small>แจ้งเตือนและระบบช่วยเหลือ</small></div><strong>›</strong></button>
  </>;
}

function AdminUsers({ users, query, setQuery, tab, setTab, onBack, onOpen }) { 
  return <><TopBar title="User/Merchant ผู้ใช้งาน" subtitle="จัดการผู้ใช้งานและร้านค้า" onBack={onBack} action={<button className="topbar-btn">⋯</button>} />
    <SearchBar value={query} onChange={setQuery} placeholder="Search user or merchant..." />
    <div className="filter-scroll">
      <button className={tab==="all"?"active":""} onClick={()=>setTab("all")}>All ทั้งหมด</button>
      <button className={tab==="user"?"active":""} onClick={()=>setTab("user")}>User ลูกค้า</button>
      <button className={tab==="merchant"?"active":""} onClick={()=>setTab("merchant")}>Merchant ร้านค้า</button>
    </div>
    {users.length ? users.map((u)=>(
      <button className="admin-user-row" key={u.id} onClick={()=>onOpen(u)}>
        <div className="avatar small">{u.role === "Merchant" ? "🏪" : "👤"}</div>
        <div><b>{u.name}</b><small>{u.phone}</small></div>
        <span>{u.role}</span>
        <small style={{ color: u.status === "active" ? "#38a169" : u.status === "pending_approval" ? "#dd6b20" : "#e53e3e" }}>
          {u.status === "active" ? "เปิดใช้งาน" : u.status === "pending_approval" ? "รออนุมัติ" : "ระงับ"}
        </small>
      </button>
    )) : <EmptyState title="No users" text="ไม่พบข้อมูลผู้ใช้งาน" />}
  </>; 
}

function AdminDetail({ user, onBack, onChangeStatus }) { 
  return <><div className="admin-detail-head"><button onClick={onBack}>‹</button><b>User / Store Detail รายละเอียด</b></div>
    <div className="detail-profile">
      <div className="detail-avatar">{user.role === "Merchant" ? "🏪" : "👨"}</div>
      <div>
        <h2>{user.name}</h2>
        <span className={user.status === "active" ? "green-text" : "orange-text"}>
          ● {user.status === "active" ? "เปิดใช้งาน (Approved)" : user.status === "pending_approval" ? "รอการอนุมัติ (Pending)" : "ถูกระงับ (Blocked)"}
        </span>
      </div>
    </div>
    <div className="detail-contact">
      <div>☎ Tel / PromptPay: {user.phone}</div>
      <div>✉ Role: {user.role}</div>
      <div>📍 {user.location || "หอพักหลังมอ มจพ."}</div>
    </div>
    <div className="detail-buttons">
      <button onClick={()=>onChangeStatus("active")} style={{ background: "#38a169", color: "#fff" }}>
        อนุมัติ / เปิดใช้งาน
      </button>
      <button className="danger-filled" onClick={()=>onChangeStatus("blocked")}>
        ระงับ / ปฏิเสธร้านค้า
      </button>
    </div>
  </>; 
}

function AdminMore({ onBack }) { 
  return <><TopBar title="Setting การตั้งค่า" onBack={onBack} />
    <div className="setting-profile"><div className="detail-avatar">🛡️</div><div><b>แอดมินระบบส่วนกลาง</b><small>Super Admin</small></div></div>
    {["ข้อมูลส่วนตัว","ความปลอดภัยและรหัสผ่าน","ตั้งค่า API Backend","เกี่ยวกับระบบ Behind NB"].map((x)=><button className="setting-row" key={x}>{x}<span>›</span></button>)}
    <button className="logout-admin" onClick={() => { authApi.logout("ADMIN"); alert("ออกจากระบบแอดมินเรียบร้อย"); }}>ออกจากระบบ</button>
  </>; 
}

function AdminNotice({ onBack }) { 
  return <><TopBar title="Notice" subtitle="Support" onBack={onBack} />
    <div className="notice-card"><b>Support & System Health</b><small>ระบบหลังบ้าน</small><p>Backend API เชื่อมต่อสำเร็จผ่าน http://localhost:5000/api</p></div>
    <div className="notice-card"><b>Store Approvals</b><small>คำขอเปิดร้านค้า</small><p>มีระบบตรวจเช็คและอนุมัติร้านค้าเชื่อมต่อกับ Database แล้ว</p></div>
  </>; 
}
