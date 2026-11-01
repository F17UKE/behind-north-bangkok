"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BottomNav, MobileShell, SearchBar, TopBar, EmptyState } from "../../components/AppShell";
import { apiData, apiRequest, clearAuthSession, getAuthSession, setAuthSession } from "../../api/axiosInstance";
import { statusLabel } from "../../data/orderStatus";

export default function AdminPage() {
  const [session, setSession] = useState(null); const [screen, setScreen] = useState("home");
  const [users, setUsers] = useState([]); const [merchants, setMerchants] = useState([]); const [orders, setOrders] = useState([]);
  const [menuMerchant, setMenuMerchant] = useState(null); const [merchantMenus, setMerchantMenus] = useState([]); const [menusLoading, setMenusLoading] = useState(false); const [menuQuery, setMenuQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null); const [query, setQuery] = useState(""); const [tab, setTab] = useState("all");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [credentials, setCredentials] = useState({ username: "", password: "" }); const [loginError, setLoginError] = useState("");
  const refresh = useCallback(async () => {
    if (getAuthSession()?.role !== "ADMIN") return;
    setBusy(true); setError("");
    try {
      const [u, m, o] = await Promise.all([apiRequest("/admin/users"), apiRequest("/admin/merchants"), apiRequest("/orders")]);
      setUsers(apiData(u)); setMerchants(apiData(m)); setOrders(apiData(o));
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { const sync=()=>setSession(getAuthSession()); sync(); window.addEventListener("storage",sync); window.addEventListener("behind-nb-auth-changed",sync); return()=>{window.removeEventListener("storage",sync);window.removeEventListener("behind-nb-auth-changed",sync);}; }, []);
  useEffect(() => {
    if (session?.role !== "ADMIN") return undefined;
    const timer = window.setTimeout(refresh, 0);
    return () => window.clearTimeout(timer);
  }, [session,refresh]);
  const filtered = useMemo(() => users.filter((u) => {
    const role = u.role === "CUSTOMER" ? "user" : "merchant";
    const text = `${u.name} ${u.phone || ""} ${u.email || ""} ${role}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (tab === "all" || tab === role);
  }), [users, query, tab]);
  async function login(e) {
    e.preventDefault(); setLoginError("");
    try { const result = apiData(await apiRequest("/auth/admin/login", { method: "POST", body: credentials })); setAuthSession({ token: result.token, role: "ADMIN", user: result.user }); setSession(getAuthSession()); }
    catch (e) { setLoginError(e.message); }
  }
  async function reviewMerchant(merchant, action) {
    try { await apiRequest(`/admin/merchants/${merchant.id}/${action}`, { method: "PATCH" }); await refresh(); if(selectedUser?.id===merchant.id) setSelectedUser({...selectedUser,is_approved:action==="approve",status:action==="approve"?"active":"pending"}); }
    catch (e) { setError(e.message); }
  }
  async function openMerchantMenus(merchant) {
    setMenuMerchant(merchant); setMerchantMenus([]); setMenusLoading(true); setMenuQuery(""); setError(""); setScreen("merchant-menus");
    try { const response = await apiRequest(`/admin/merchants/${merchant.id}/menus`); setMerchantMenus(apiData(response)); }
    catch (e) { setError(e.message); }
    finally { setMenusLoading(false); }
  }
  if(session?.role !== "ADMIN") return <MobileShell tone="admin"><div className="admin-page role-auth-layout"><div className="merchant-order-card role-auth-card"><h1>เข้าสู่ระบบผู้ดูแล</h1><p>ลงชื่อเข้าใช้เพื่อจัดการข้อมูลจากระบบ</p><form onSubmit={login}><input required placeholder="ชื่อผู้ใช้" value={credentials.username} onChange={(e)=>setCredentials({...credentials,username:e.target.value})}/><input required type="password" placeholder="รหัสผ่าน" value={credentials.password} onChange={(e)=>setCredentials({...credentials,password:e.target.value})}/><button className="primary-btn">เข้าสู่ระบบ</button></form>{loginError&&<p role="alert">{loginError}</p>}</div></div></MobileShell>;
  const completed = orders.filter((o)=>o.status==="COMPLETED");
  return <MobileShell tone="admin"><div className="admin-page screen-enter">
    {error&&<div className="api-error" role="alert">{error}<button onClick={()=>setError("")}>×</button></div>}
    {screen==="home"&&<><div className="admin-header"><div className="avatar peach">♙</div><div><b>{session.user?.username||"ผู้ดูแลระบบ"}</b><small>Admin · ข้อมูลจากฐานข้อมูล</small></div><button onClick={refresh} disabled={busy}>↻</button></div><div className="admin-stats"><div><b>{orders.length}</b><small>ออเดอร์ทั้งหมด</small></div><div><b>{completed.length}</b><small>สำเร็จ</small></div><div><b>{merchants.length}</b><small>ร้านค้า</small></div><div><b>{users.filter((u)=>u.role==="CUSTOMER").length}</b><small>ลูกค้า</small></div></div><button className="admin-action-card admin-view-menus" onClick={()=>setScreen("menus")}><span>🍽️</span><div><b>ดูเมนูร้านค้าทั้งหมด</b><small>รูปภาพ ราคา และตัวเลือกเสริม · ดูอย่างเดียว</small></div><strong>→</strong></button><div className="section-header"><b>ร้านค้ารออนุมัติ</b><button onClick={()=>setScreen("merchants")}>ดูทั้งหมด ›</button></div>{merchants.filter((m)=>!m.is_approved).slice(0,5).map((m)=><div className="admin-user-row" key={m.id}><div className="avatar small">🏪</div><div><b>{m.store_name}</b><small>{m.location||"ไม่ได้ระบุที่ตั้ง"}</small></div><button onClick={()=>reviewMerchant(m,"approve")}>อนุมัติ</button></div>)}{!merchants.some((m)=>!m.is_approved)&&<p>ไม่มีร้านค้ารออนุมัติ</p>}<div className="section-header"><b>ออเดอร์ล่าสุด</b><button onClick={()=>setScreen("orders")}>ดูทั้งหมด ›</button></div>{orders.slice(0,5).map((o)=><div className="admin-user-row" key={o.id}><div><b>{o.order_code}</b><small>{o.store_name} · {o.customer_username}</small></div><span>{statusLabel[o.status]||o.status}</span></div>)}</>}
    {screen==="users"&&<><TopBar title="ผู้ใช้งาน" subtitle={`${users.length} บัญชี`} onBack={()=>setScreen("home")}/><SearchBar value={query} onChange={setQuery} placeholder="ค้นหาชื่อหรืออีเมล"/><div className="filter-scroll">{[["all","ทั้งหมด"],["user","ลูกค้า"],["merchant","ร้านค้า"]].map(([k,l])=><button key={k} className={tab===k?"active":""} onClick={()=>setTab(k)}>{l}</button>)}</div>{filtered.map((u)=><button className="admin-user-row" key={`${u.role}-${u.id}`} onClick={()=>{setSelectedUser(u);setScreen("detail");}}><div className="avatar small">{u.role==="MERCHANT"?"🏪":"👤"}</div><div><b>{u.name}</b><small>{u.email||u.phone||"ไม่มีข้อมูลติดต่อ"}</small></div><span>{u.role==="MERCHANT"?"ร้านค้า":"ลูกค้า"}</span><small>{u.status}</small></button>)}{!filtered.length&&<EmptyState title="ไม่พบผู้ใช้" text="ข้อมูลจะแสดงเมื่อมีบัญชีในระบบ"/>}</>}
    {screen==="merchants"&&<><TopBar title="จัดการร้านค้า" onBack={()=>setScreen("home")}/>{merchants.map((m)=><div className="merchant-order-card" key={m.id}><b>{m.store_name}</b><small>{m.location||"ไม่ระบุที่ตั้ง"} · {m.is_approved?"อนุมัติแล้ว":"รออนุมัติ"} · {m.is_open?"เปิดร้าน":"ปิดร้าน"}</small><div><button className="admin-read-menu-link" onClick={()=>openMerchantMenus(m)}>ดูเมนู</button>{!m.is_approved&&<button onClick={()=>reviewMerchant(m,"approve")}>อนุมัติ</button>}{m.is_approved&&<button onClick={()=>reviewMerchant(m,"reject")}>ระงับการอนุมัติ</button>}</div></div>)}{!merchants.length&&<EmptyState title="ไม่มีร้านค้า" text="ร้านค้าที่สมัครจะแสดงที่นี่"/>}</>}
    {screen==="menus"&&<><TopBar title="เมนูร้านค้า" subtitle={`${merchants.length} ร้าน`} onBack={()=>setScreen("home")}/><p className="admin-menu-readonly-note">เลือกดูเมนูของร้านค้าได้ทุกร้าน รวมรายการที่ปิดขาย</p>{merchants.map((merchant)=><button type="button" className="admin-user-row admin-menu-merchant-row" key={merchant.id} onClick={()=>openMerchantMenus(merchant)}><div className="avatar small">🏪</div><div><b>{merchant.store_name}</b><small>{merchant.category||"ร้านอาหาร"} · {merchant.is_open?"เปิดร้าน":"ปิดร้าน"}</small></div><span>ดูเมนู ›</span></button>)}{!merchants.length&&<EmptyState title="ไม่มีร้านค้า" text="ร้านค้าที่สมัครจะแสดงที่นี่"/>}</>}
    {screen==="merchant-menus"&&<><TopBar title="เมนูของร้าน" subtitle={menuMerchant?.store_name} onBack={()=>setScreen("menus")}/>{menusLoading?<EmptyState title="กำลังโหลดเมนู" text="กำลังดึงข้อมูลเมนูจากระบบ"/>:<><SearchBar value={menuQuery} onChange={setMenuQuery} placeholder="ค้นหาเมนูในร้านนี้"/><div className="admin-menu-list-summary">{merchantMenus.filter((menu)=>`${menu.name} ${menu.description||""}`.toLocaleLowerCase().includes(menuQuery.trim().toLocaleLowerCase())).length} เมนู</div><div className="admin-menu-grid">{merchantMenus.filter((menu)=>`${menu.name} ${menu.description||""}`.toLocaleLowerCase().includes(menuQuery.trim().toLocaleLowerCase())).map((menu)=><article className="admin-readonly-menu-card" key={menu.id}><div className="admin-readonly-menu-photo">{menu.image_url?<img src={menu.image_url} alt={menu.name} loading="lazy"/>:<span>🍽️</span>}<small className={menu.is_available===false?"paused":""}>{menu.is_available===false?"ปิดขาย":"พร้อมขาย"}</small></div><div className="admin-readonly-menu-content"><div className="admin-readonly-menu-heading"><div><h3>{menu.name}</h3><p>{menu.description||"ไม่มีรายละเอียดเมนู"}</p></div><strong>฿{Number(menu.price||0).toLocaleString("th-TH")}</strong></div>{menu.option_groups?.length>0&&<div className="admin-readonly-options"><b>ตัวเลือกเสริม</b>{menu.option_groups.map((group)=><div key={group.id}><span>{group.name} · {group.is_required?"จำเป็น":"ไม่บังคับ"}{group.allow_multiple?" · เลือกได้หลายรายการ":""}</span>{group.choices?.map((choice)=><small key={choice.id}>{choice.name} <strong>+{Number(choice.extra_price||0).toLocaleString("th-TH")} ฿</strong></small>)}</div>)}</div>}</div></article>)}</div>{!merchantMenus.length&&!error&&<EmptyState title="ร้านนี้ยังไม่มีเมนู" text="รายการเมนูจะแสดงที่นี่เมื่อร้านค้าเพิ่มเมนู"/>}{merchantMenus.length>0&&!merchantMenus.some((menu)=>`${menu.name} ${menu.description||""}`.toLocaleLowerCase().includes(menuQuery.trim().toLocaleLowerCase()))&&<EmptyState title="ไม่พบเมนู" text="ลองค้นด้วยชื่อเมนูหรือรายละเอียดอื่น"/>}</>}</>}
    {screen==="orders"&&<><TopBar title="ออเดอร์ทั้งหมด" onBack={()=>setScreen("home")}/>{orders.map((o)=><div className="merchant-order-card" key={o.id}><b>{o.order_code}</b><small>{o.store_name} · {o.customer_username} · {new Date(o.created_at).toLocaleString("th-TH")}</small><span>{statusLabel[o.status]||o.status} · {Number(o.total_amount||0).toLocaleString("th-TH")} ฿</span></div>)}{!orders.length&&<EmptyState title="ไม่มีออเดอร์" text="ออเดอร์จากระบบจะแสดงที่นี่"/>}</>}
    {screen==="detail"&&selectedUser&&<><TopBar title="รายละเอียดบัญชี" onBack={()=>setScreen("users")}/><div className="merchant-order-card"><h2>{selectedUser.name}</h2><p>{selectedUser.role}</p><p>{selectedUser.email||"ไม่ระบุอีเมล"}</p><p>{selectedUser.phone||"ไม่ระบุเบอร์โทร"}</p>{selectedUser.role==="MERCHANT"&&<><p>{selectedUser.is_approved?"อนุมัติแล้ว":"รออนุมัติ"} · {selectedUser.is_open?"เปิดร้าน":"ปิดร้าน"}</p>{!selectedUser.is_approved&&<button className="primary-btn" onClick={()=>reviewMerchant(selectedUser,"approve")}>อนุมัติร้าน</button>}{selectedUser.is_approved&&<button onClick={()=>reviewMerchant(selectedUser,"reject")}>ระงับการอนุมัติ</button>}</>}<p>รายละเอียดบัญชีอ้างอิงจากข้อมูล backend ที่มี</p></div></>}
    {screen==="more"&&<><TopBar title="ตั้งค่า" onBack={()=>setScreen("home")}/><div className="merchant-order-card"><p>บัญชีผู้ดูแล: {session.user?.username}</p><button onClick={()=>{clearAuthSession();setSession(null);setScreen("home");}}>ออกจากระบบ</button></div></>}
    {screen==="notice"&&<><TopBar title="รายการที่ต้องติดตาม" onBack={()=>setScreen("home")}/><div className="merchant-order-card"><b>ร้านค้ารออนุมัติ</b><p>{merchants.filter((m)=>!m.is_approved).length} ร้าน</p><button onClick={()=>setScreen("merchants")}>ตรวจสอบร้านค้า</button></div><div className="merchant-order-card"><b>ออเดอร์ที่กำลังดำเนินการ</b><p>{orders.filter((o)=>!["COMPLETED","CANCELLED_BY_CUSTOMER","REJECTED_BY_MERCHANT"].includes(o.status)).length} รายการ</p><button onClick={()=>setScreen("orders")}>ดูออเดอร์</button></div></>}
    <BottomNav tone="admin" active={screen} onChange={setScreen} items={[{key:"home",label:"หน้าหลัก",icon:"⌂"},{key:"users",label:"ผู้ใช้",icon:"♙"},{key:"notice",label:"ติดตาม",icon:"●"},{key:"more",label:"อื่นๆ",icon:"•••"}]}/>
  </div></MobileShell>;
}
