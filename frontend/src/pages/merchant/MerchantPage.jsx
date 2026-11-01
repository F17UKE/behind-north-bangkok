"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { BottomNav, MobileShell, SearchBar, StatusPill, TopBar, EmptyState } from "../../components/AppShell";
import { apiData, apiRequest, clearAuthSession, getAuthSession, setAuthSession } from "../../api/axiosInstance";
import { statusLabel } from "../../data/orderStatus";

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "").replace(/\/$/, "");
const money = (n) => Number(n || 0).toLocaleString("th-TH");
const toOrder = (order) => ({
  ...order,
  order_id: Number(order.id),
  id: order.order_code || String(order.id),
  customer: order.customer_username || "ลูกค้า",
  total: Number(order.total_amount || 0),
  time: order.created_at ? new Date(order.created_at).toLocaleString("th-TH") : "",
  items: (order.items || []).map((item) => `${item.menu_name || "เมนู"} ×${item.quantity}${item.note ? ` · ${item.note}` : ""}`),
});

export default function MerchantPage() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menus, setMenus] = useState([]);
  const [sois, setSois] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [screen, setScreen] = useState("home");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [menuDraft, setMenuDraft] = useState({ name: "", description: "", price: "", image_url: "" });
  const [feeDraft, setFeeDraft] = useState({ soi_id: "", fee: "" });
  const [passwordDraft, setPasswordDraft] = useState({ current_password: "", new_password: "" });
  const [passwordMessage, setPasswordMessage] = useState("");

  const refresh = useCallback(async () => {
    if (getAuthSession()?.role !== "MERCHANT") return;
    setLoading(true); setError("");
    try {
      const [profileRes, orderRes, menuRes, feeRes, soiRes] = await Promise.all([
        apiRequest("/merchant-management/profile"), apiRequest("/orders"),
        apiRequest("/merchant-management/menus"), apiRequest("/merchant-management/delivery-fees"), apiRequest("/sois"),
      ]);
      setProfile(apiData(profileRes));
      setOrders(apiData(orderRes).map(toOrder));
      setMenus(apiData(menuRes));
      setFees(apiData(feeRes));
      setSois(apiData(soiRes));
      setFeeDraft((current) => current.soi_id || !apiData(soiRes).length ? current : { ...current, soi_id: String(apiData(soiRes)[0].id) });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const sync = () => setSession(getAuthSession());
    sync(); window.addEventListener("storage", sync); window.addEventListener("behind-nb-auth-changed", sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("behind-nb-auth-changed", sync); };
  }, []);
  useEffect(() => {
    if (session?.role !== "MERCHANT") return undefined;
    const timer = window.setTimeout(refresh, 0);
    return () => window.clearTimeout(timer);
  }, [session, refresh]);
  useEffect(() => {
    if (session?.role !== "MERCHANT" || !session.token) return undefined;

    const socket = io(SOCKET_URL, { auth: { token: session.token } });
    const handleNewOrder = async () => {
      try {
        const response = await apiRequest("/orders");
        setOrders(apiData(response).map(toOrder));
      } catch (e) {
        setError(e.message);
      }
    };

    socket.on("NEW_ORDER_RECEIVED", handleNewOrder);
    socket.on("ORDER_STATUS_UPDATED", handleNewOrder);
    return () => {
      socket.off("NEW_ORDER_RECEIVED", handleNewOrder);
      socket.off("ORDER_STATUS_UPDATED", handleNewOrder);
      socket.disconnect();
    };
  }, [session?.role, session?.token]);
  useEffect(() => {
    if (screen !== "chat" || !selectedOrder) return;
    apiRequest(`/orders/${selectedOrder.order_id || selectedOrder.id}/messages`).then((r) => setMessages(apiData(r) || [])).catch((e) => setError(e.message));
  }, [screen, selectedOrder]);

  const visibleOrders = useMemo(() => orders.filter((o) => {
    const text = `${o.id} ${o.customer}`.toLowerCase();
    if (!text.includes(query.toLowerCase())) return false;
    if (filter === "pending") return ["PENDING_ACCEPT", "PENDING_PAYMENT"].includes(o.status);
    if (filter === "preparing") return o.status === "PREPARING";
    if (filter === "done") return ["READY_FOR_DELIVERY", "IN_DELIVERY", "COMPLETED"].includes(o.status);
    return true;
  }), [orders, filter, query]);

  async function login(form) {
    try {
      const result = apiData(await apiRequest("/auth/merchant/login", { method: "POST", body: form }));
      setAuthSession({ token: result.token, role: "MERCHANT", user: result.merchant || result.user });
      setSession(getAuthSession()); setError(""); return "";
    } catch (e) { return e.message; }
  }
  async function register(form) {
    try {
      await apiRequest("/auth/merchant/register", { method: "POST", body: { ...form, category: "ร้านอาหาร" } });
      return await login({ username: form.username, password: form.password });
    } catch (e) { return e.message; }
  }
  async function changeStatus(order, status) {
    setError("");
    try { await apiRequest(`/orders/${order.order_id || order.id}/status`, { method: "PUT", body: { status } }); await refresh(); }
    catch (e) { setError(e.message); }
  }
  async function toggleStore() {
    try { await apiRequest("/merchant-management/status", { method: "PATCH", body: { is_open: !profile?.is_open } }); await refresh(); }
    catch (e) { setError(e.message); }
  }
  async function saveMenu(e) {
    e.preventDefault();
    try { await apiRequest("/merchant-management/menus", { method: "POST", body: { ...menuDraft, price: Number(menuDraft.price), is_available: true, image_url: menuDraft.image_url || null } }); setMenuDraft({ name: "", description: "", price: "", image_url: "" }); await refresh(); }
    catch (e) { setError(e.message); }
  }
  async function saveFee(e) {
    e.preventDefault();
    try { await apiRequest("/merchant-management/delivery-fees", { method: "PUT", body: { soi_id: Number(feeDraft.soi_id), fee: Number(feeDraft.fee) } }); await refresh(); }
    catch (e) { setError(e.message); }
  }
  async function changePassword(e) {
    e.preventDefault(); setPasswordMessage("");
    try {
      const response = await apiRequest("/merchant-management/password", { method:"PATCH", body:passwordDraft });
      setPasswordMessage(apiData(response).message || "เปลี่ยนรหัสผ่านแล้ว");
      setPasswordDraft({ current_password:"", new_password:"" });
    } catch (e) { setError(e.message); }
  }
  async function sendChat(e) {
    e.preventDefault(); if (!chatText.trim() || !selectedOrder) return;
    try { await apiRequest(`/orders/${selectedOrder.order_id || selectedOrder.id}/messages`, { method: "POST", body: { contentText: chatText.trim(), messageType: "TEXT" } }); setChatText(""); const r = await apiRequest(`/orders/${selectedOrder.order_id || selectedOrder.id}/messages`); setMessages(apiData(r) || []); }
    catch (e) { setError(e.message); }
  }

  if (session?.role !== "MERCHANT") return <MerchantAuth onLogin={login} onRegister={register} error={error} />;
  return <MobileShell tone="merchant"><div className="merchant-page screen-enter">
    {error && <div className="api-error" role="alert">{error}<button onClick={() => setError("")}>×</button></div>}
    {screen === "home" && <><div className="merchant-profile"><div className="avatar peach">🏪</div><div><b>{profile?.store_name || "ร้านค้า"}</b><small>{profile?.is_approved ? (profile.is_open ? "เปิดร้านอยู่" : "ปิดร้านอยู่") : "รอผู้ดูแลอนุมัติ"}</small></div><button onClick={toggleStore} disabled={!profile?.is_approved}>{profile?.is_open ? "ปิดร้าน" : "เปิดร้าน"}</button></div><SearchBar value={query} onChange={setQuery} placeholder="ค้นหาออเดอร์"/><div className="merchant-stats"><div><b>{orders.length}</b><small>ออเดอร์ทั้งหมด</small></div><div><b>{money(orders.filter((o) => o.status === "COMPLETED").reduce((n, o) => n + o.total, 0))} ฿</b><small>ยอดออเดอร์สำเร็จ</small></div></div><div className="section-header"><b>ออเดอร์ล่าสุด</b><button onClick={() => setScreen("orders")}>ดูทั้งหมด ›</button></div>{orders.slice(0, 5).map((o) => <button className="merchant-recent" key={o.id} onClick={() => { setSelectedOrder(o); setScreen("orders"); }}><div><b>{o.customer}</b><small>{o.id} · {statusLabel[o.status] || o.status}</small></div><strong>{money(o.total)} ฿</strong></button>)}{!orders.length && <EmptyState title="ยังไม่มีออเดอร์" text={loading ? "กำลังโหลดข้อมูล" : "ออเดอร์จากลูกค้าจะแสดงที่นี่"}/>}<div className="section-header"><b>เมนูร้าน</b><button onClick={() => setScreen("menu")}>จัดการเมนู ›</button></div></>}
    {screen === "orders" && <><TopBar title="ออเดอร์" onBack={() => setScreen("home")}/><SearchBar value={query} onChange={setQuery} placeholder="ค้นหาออเดอร์"/><div className="filter-scroll merchant-filters">{[["all","ทั้งหมด"],["pending","รอรับ/ชำระ"],["preparing","กำลังทำ"],["done","พร้อมส่ง/สำเร็จ"]].map(([k,l]) => <button key={k} className={filter===k?"active":""} onClick={() => setFilter(k)}>{l}</button>)}</div>{visibleOrders.map((o) => <div className="merchant-order-card" key={o.id}><div className="order-head"><div><b>{o.customer}</b><small>{o.id} · {o.time}</small></div><strong>{money(o.total)} ฿</strong></div><div className="order-items">{o.items.map((x,i)=><span key={i}>• {x}</span>)}</div><div className="order-footer"><StatusPill tone="orange">{statusLabel[o.status] || o.status}</StatusPill><div>{o.status === "PENDING_ACCEPT" && <><button onClick={() => changeStatus(o,"PENDING_PAYMENT")}>รับออเดอร์</button><button onClick={() => changeStatus(o,"REJECTED_BY_MERCHANT")}>ปฏิเสธ</button></>}{o.status === "PENDING_PAYMENT" && <small>รอลูกค้าชำระเงิน</small>}{o.status === "PAID" && <button className="accept-button" onClick={() => changeStatus(o,"PREPARING")}>เริ่มทำอาหาร</button>}{o.status === "PREPARING" && <button className="accept-button" onClick={() => changeStatus(o,"READY_FOR_DELIVERY")}>พร้อมส่ง</button>}{o.status === "READY_FOR_DELIVERY" && <button className="accept-button" onClick={() => changeStatus(o,"IN_DELIVERY")}>เริ่มจัดส่ง</button>}{o.status === "IN_DELIVERY" && <button className="accept-button" onClick={() => changeStatus(o,"COMPLETED")}>ส่งสำเร็จ</button>}<button onClick={() => { setSelectedOrder(o); setScreen("chat"); }}>แชท</button></div></div></div>)}{!visibleOrders.length && <EmptyState title="ไม่พบออเดอร์" text="ลองเปลี่ยนตัวกรองหรือค้นหาใหม่"/>}</>}
    {screen === "menu" && <><TopBar title="จัดการเมนู" onBack={() => setScreen("home")}/><form className="merchant-order-card" onSubmit={saveMenu}><h3>เพิ่มเมนู</h3><input required placeholder="ชื่อเมนู" value={menuDraft.name} onChange={(e)=>setMenuDraft({...menuDraft,name:e.target.value})}/><input placeholder="รายละเอียด" value={menuDraft.description} onChange={(e)=>setMenuDraft({...menuDraft,description:e.target.value})}/><input required type="number" min="0" step="0.01" placeholder="ราคา" value={menuDraft.price} onChange={(e)=>setMenuDraft({...menuDraft,price:e.target.value})}/><input type="url" placeholder="ลิงก์รูปเมนู (ถ้ามี)" value={menuDraft.image_url} onChange={(e)=>setMenuDraft({...menuDraft,image_url:e.target.value})}/><button className="primary-btn">บันทึกเมนู</button></form>{menus.map((m) => <div className="merchant-order-card" key={m.id}><b>{m.name}</b><span>{money(m.price)} ฿ · {m.is_available ? "ขายอยู่" : "หยุดขาย"}</span><button onClick={async()=>{try{await apiRequest(`/merchant-management/menus/${m.id}/availability`,{method:"PATCH",body:{is_available:!m.is_available}});await refresh();}catch(e){setError(e.message);}}}>{m.is_available?"หยุดขาย":"เปิดขาย"}</button><button onClick={async()=>{if(!window.confirm(`ลบเมนู ${m.name}?`))return;try{await apiRequest(`/merchant-management/menus/${m.id}`,{method:"DELETE"});await refresh();}catch(e){setError(e.message);}}}>ลบ</button><MerchantMenuOptions menu={m} onError={(message)=>setError(message)}/></div>)}{!menus.length && <EmptyState title="ยังไม่มีเมนู" text="เพิ่มเมนูแรกของร้านได้จากแบบฟอร์มด้านบน"/>}</>}
    {screen === "delivery" && <><TopBar title="ค่าจัดส่ง" onBack={() => setScreen("home")}/><form className="delivery-fee-box" onSubmit={saveFee}><h3>กำหนดค่าจัดส่งตามซอย</h3><select required value={feeDraft.soi_id} onChange={(e)=>setFeeDraft({...feeDraft,soi_id:e.target.value})}><option value="">เลือกซอย</option>{sois.map((s)=><option value={s.id} key={s.id}>{s.name}</option>)}</select><input required type="number" min="0" step="0.01" placeholder="ค่าจัดส่ง (บาท)" value={feeDraft.fee} onChange={(e)=>setFeeDraft({...feeDraft,fee:e.target.value})}/><button className="primary-btn">บันทึกค่าจัดส่ง</button></form>{fees.map((f)=><div className="merchant-order-card" key={f.id}>{f.soi_name}<strong>{money(f.fee)} ฿</strong></div>)}</>}
    {screen === "chat" && <><TopBar title="แชทออเดอร์" subtitle={selectedOrder?.id} onBack={() => setScreen("orders")}/><div className="chat-panel"><div className="chat-messages short">{messages.map((m)=><div className={`chat-bubble ${m.is_merchant_sender ? "me" : "store"}`} key={m.id}>{m.content_text}</div>)}{!messages.length && <EmptyState title="ยังไม่มีข้อความ" text="เริ่มสนทนากับลูกค้าของออเดอร์นี้"/>}</div><form className="chat-compose" onSubmit={sendChat}><input value={chatText} onChange={(e)=>setChatText(e.target.value)} placeholder="เขียนข้อความ..."/><button>➤</button></form></div></>}
    {screen === "profile" && <><TopBar title="ข้อมูลร้าน" onBack={() => setScreen("home")}/><div className="merchant-order-card"><h3>{profile?.store_name}</h3><p>{profile?.location || "ยังไม่ได้ระบุที่ตั้ง"}</p><p>{profile?.promptpay_id || "ยังไม่ได้ระบุ PromptPay"}</p><p>{profile?.is_approved ? "อนุมัติแล้ว" : "รอการอนุมัติจากผู้ดูแล"}</p><button onClick={async()=>{const next=window.prompt("ชื่อร้าน",profile?.store_name||"");if(!next)return;try{await apiRequest("/merchant-management/profile",{method:"PUT",body:{store_name:next,location:profile?.location,promptpay_id:profile?.promptpay_id,store_image_url:profile?.store_image_url}});await refresh();}catch(e){setError(e.message);}}}>แก้ไขชื่อร้าน</button></div><form className="merchant-order-card" onSubmit={changePassword}><h3>ตั้งรหัสผ่านใหม่</h3><input required type="password" autoComplete="current-password" placeholder="รหัสผ่านปัจจุบัน" value={passwordDraft.current_password} onChange={(e)=>setPasswordDraft({...passwordDraft,current_password:e.target.value})}/><input required minLength={8} type="password" autoComplete="new-password" placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)" value={passwordDraft.new_password} onChange={(e)=>setPasswordDraft({...passwordDraft,new_password:e.target.value})}/><button className="primary-btn">เปลี่ยนรหัสผ่าน</button>{passwordMessage&&<p role="status">{passwordMessage}</p>}</form><div className="merchant-order-card"><button onClick={()=>{clearAuthSession();setSession(null);}}>ออกจากระบบ</button></div></>}
    <BottomNav tone="merchant" active={screen} onChange={(key)=>setScreen(key)} items={[{key:"home",label:"หน้าหลัก",icon:"⌂"},{key:"orders",label:"ออเดอร์",icon:"▣"},{key:"menu",label:"เมนู",icon:"☷"},{key:"delivery",label:"จัดส่ง",icon:"🛵"},{key:"profile",label:"ร้าน",icon:"♙"}]}/>
  </div></MobileShell>;
}

function MerchantAuth({ onLogin, onRegister, error }) {
  const [mode, setMode] = useState("login"); const [form, setForm] = useState({ username:"", password:"", store_name:"" }); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e) { e.preventDefault(); setBusy(true); const result = mode === "login" ? await onLogin(form) : await onRegister(form); setMessage(result || ""); setBusy(false); }
  return <MobileShell tone="merchant"><div className="merchant-page"><div className="merchant-order-card"><h1>{mode === "login" ? "เข้าสู่ระบบร้านค้า" : "สมัครร้านค้า"}</h1><p>ใช้บัญชีร้านค้าที่เชื่อมกับระบบ</p><form onSubmit={submit}><input required minLength="3" placeholder="ชื่อผู้ใช้" value={form.username} onChange={(e)=>setForm({...form,username:e.target.value})}/><input required minLength="6" type="password" placeholder="รหัสผ่าน" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})}/>{mode === "register" && <input required minLength="2" placeholder="ชื่อร้าน" value={form.store_name} onChange={(e)=>setForm({...form,store_name:e.target.value})}/>}<button disabled={busy} className="primary-btn">{busy?"กำลังดำเนินการ...":mode==="login"?"เข้าสู่ระบบ":"สมัครร้านค้า"}</button></form>{(message||error)&&<p role="alert">{message||error}</p>}<button onClick={()=>{setMode(mode==="login"?"register":"login");setMessage("");}}>{mode==="login"?"ยังไม่มีบัญชี? สมัครร้านค้า":"มีบัญชีแล้ว? เข้าสู่ระบบ"}</button></div></div></MobileShell>;
}

function MerchantMenuOptions({ menu, onError }) {
  const [open, setOpen] = useState(false); const [loaded, setLoaded] = useState(false); const [groups, setGroups] = useState([]);
  const [groupForm, setGroupForm] = useState({ name: "", is_required: false, allow_multiple: false });
  async function loadGroups() {
    try { const details = apiData(await apiRequest(`/menus/${menu.id}`)); setGroups(details.option_groups || []); setLoaded(true); }
    catch (e) { onError(e.message); }
  }
  async function toggleOpen() { const next = !open; setOpen(next); if (next && !loaded) await loadGroups(); }
  async function addGroup(e) {
    e.preventDefault();
    try { await apiRequest(`/merchant-management/menus/${menu.id}/option-groups`, { method:"POST", body:groupForm }); setGroupForm({ name:"", is_required:false, allow_multiple:false }); await loadGroups(); }
    catch (e) { onError(e.message); }
  }
  async function addChoice(groupId, choice) {
    try { await apiRequest(`/merchant-management/menus/option-groups/${groupId}/choices`, { method:"POST", body:{ name:choice.name, extra_price:Number(choice.extra_price||0) } }); await loadGroups(); }
    catch (e) { onError(e.message); }
  }
  return <section className="menu-options-editor"><button type="button" onClick={toggleOpen}>{open ? "ซ่อนตัวเลือกเสริม" : "จัดการตัวเลือกเสริม"}</button>{open&&<><form onSubmit={addGroup}><h4>เพิ่มกลุ่มตัวเลือก</h4><input required placeholder="เช่น เพิ่มท็อปปิง" value={groupForm.name} onChange={(e)=>setGroupForm({...groupForm,name:e.target.value})}/><label><input type="checkbox" checked={groupForm.is_required} onChange={(e)=>setGroupForm({...groupForm,is_required:e.target.checked})}/> ต้องเลือกอย่างน้อยหนึ่งรายการ</label><label><input type="checkbox" checked={groupForm.allow_multiple} onChange={(e)=>setGroupForm({...groupForm,allow_multiple:e.target.checked})}/> เลือกได้หลายรายการ</label><button>เพิ่มกลุ่ม</button></form>{groups.map((group)=><OptionGroupEditor key={group.id} group={group} onAdd={(choice)=>addChoice(group.id,choice)}/>)}</>}</section>;
}

function OptionGroupEditor({ group, onAdd }) {
  const [name, setName] = useState(""); const [price, setPrice] = useState("0");
  return <div className="option-group-editor"><b>{group.name}</b><small>{group.is_required?"จำเป็น":"ไม่บังคับ"} · {group.allow_multiple?"เลือกหลายรายการ":"เลือกหนึ่งรายการ"}</small>{(group.choices||[]).map((choice)=><div key={choice.id}>{choice.name} (+{money(choice.extra_price)} ฿)</div>)}<form onSubmit={(e)=>{e.preventDefault();onAdd({name,extra_price:price});setName("");setPrice("0");}}><input required placeholder="ชื่อตัวเลือก" value={name} onChange={(e)=>setName(e.target.value)}/><input type="number" min="0" step="0.01" value={price} onChange={(e)=>setPrice(e.target.value)}/><button>เพิ่มตัวเลือก</button></form></div>;
}
