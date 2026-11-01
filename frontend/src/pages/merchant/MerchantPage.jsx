"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { BottomNav, MobileShell, SearchBar, StatusPill, TopBar, EmptyState } from "../../components/AppShell";
import { apiData, apiRequest, clearAuthSession, getApiBaseUrl, getAuthSession, setAuthSession } from "../../api/axiosInstance";
import { statusLabel, statusTone } from "../../data/orderStatus";

const getSocketUrl = () => {
  const apiUrl = getApiBaseUrl();
  if (apiUrl.startsWith("/")) return `${window.location.protocol}//${window.location.hostname}:5000`;
  return apiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
};
const money = (n) => Number(n || 0).toLocaleString("th-TH");
const toOrder = (order) => ({
  ...order,
  order_id: Number(order.id),
  id: order.order_code || String(order.id),
  customer: order.customer_username || "ลูกค้า",
  total: Number(order.total_amount || 0),
  unreadMessageCount: Number(order.unread_message_count || 0),
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
  const chatMessagesRef = useRef(null);
  const lastReadChatMessageId = useRef(0);
  const [chatText, setChatText] = useState("");
  const [menuDraft, setMenuDraft] = useState({ name: "", description: "", price: "", image_url: "" });
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [menuImageFile, setMenuImageFile] = useState(null);
  const [menuImagePreview, setMenuImagePreview] = useState("");
  const [savingMenu, setSavingMenu] = useState(false);
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

    const socket = io(getSocketUrl(), { auth: { token: session.token } });
    const handleNewOrder = async () => {
      try {
        const response = await apiRequest("/orders");
        setOrders(apiData(response).map(toOrder));
      } catch (e) {
        setError(e.message);
      }
    };
    const handleNewChatMessage = async ({ orderId }) => {
      await handleNewOrder();
      if (screen !== "chat" || Number(selectedOrder?.order_id) !== Number(orderId)) return;
      try {
        const messagesResponse = await apiRequest(`/orders/${orderId}/messages`);
        const nextMessages = apiData(messagesResponse) || [];
        setMessages(nextMessages);
        const latestMessageId = Math.max(0, ...nextMessages.map((message) => Number(message.id) || 0));
        if (latestMessageId > lastReadChatMessageId.current) {
          await apiRequest(`/orders/${orderId}/messages/read`, { method: "PUT", body: { message_id: latestMessageId } });
          lastReadChatMessageId.current = latestMessageId;
        }
        setOrders((current) => current.map((order) => Number(order.order_id) === Number(orderId) ? { ...order, unreadMessageCount: 0 } : order));
      } catch (e) { setError(e.message); }
    };

    socket.on("NEW_ORDER_RECEIVED", handleNewOrder);
    socket.on("ORDER_STATUS_UPDATED", handleNewOrder);
    socket.on("NEW_CHAT_MESSAGE", handleNewChatMessage);
    return () => {
      socket.off("NEW_ORDER_RECEIVED", handleNewOrder);
      socket.off("ORDER_STATUS_UPDATED", handleNewOrder);
      socket.off("NEW_CHAT_MESSAGE", handleNewChatMessage);
      socket.disconnect();
    };
  }, [session?.role, session?.token, screen, selectedOrder?.order_id]);
  useEffect(() => () => {
    if (menuImagePreview.startsWith("blob:")) URL.revokeObjectURL(menuImagePreview);
  }, [menuImagePreview]);
  useEffect(() => {
    if (!editingMenuId) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => { if (event.key === "Escape") clearMenuDraft(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [editingMenuId]);
  useEffect(() => {
    if (screen !== "chat" || !selectedOrder) return;
    const orderId = selectedOrder.order_id || selectedOrder.id;
    apiRequest(`/orders/${orderId}/messages`).then(async (r) => {
      const nextMessages = apiData(r) || [];
      setMessages(nextMessages);
      const latestMessageId = Math.max(0, ...nextMessages.map((message) => Number(message.id) || 0));
      if (latestMessageId > lastReadChatMessageId.current) {
        await apiRequest(`/orders/${orderId}/messages/read`, { method: "PUT", body: { message_id: latestMessageId } });
        lastReadChatMessageId.current = latestMessageId;
      }
      setOrders((current) => current.map((order) => Number(order.order_id) === Number(orderId) ? { ...order, unreadMessageCount: 0 } : order));
    }).catch((e) => setError(e.message));
  }, [screen, selectedOrder]);
  useEffect(() => { lastReadChatMessageId.current = 0; }, [selectedOrder?.order_id]);
  useEffect(() => {
    if (screen !== "chat" || !selectedOrder) return undefined;
    let cancelled = false;
    const orderId = selectedOrder.order_id || selectedOrder.id;
    const syncChat = async () => {
      try {
        const nextMessages = apiData(await apiRequest(`/orders/${orderId}/messages`)) || [];
        if (cancelled) return;
        setMessages(nextMessages);
        const latestMessageId = Math.max(0, ...nextMessages.map((message) => Number(message.id) || 0));
        if (latestMessageId > lastReadChatMessageId.current) {
          await apiRequest(`/orders/${orderId}/messages/read`, { method: "PUT", body: { message_id: latestMessageId } });
          lastReadChatMessageId.current = latestMessageId;
          if (!cancelled) setOrders((current) => current.map((order) => Number(order.order_id) === Number(orderId) ? { ...order, unreadMessageCount: 0 } : order));
        }
      } catch (e) { if (!cancelled) setError(e.message); }
    };
    const timer = window.setInterval(syncChat, 5000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [screen, selectedOrder?.order_id]);
  useEffect(() => {
    if (screen !== "orders") return undefined;
    let cancelled = false;
    const refreshUnreadCounts = async () => {
      try {
        const response = await apiRequest("/orders");
        if (!cancelled) setOrders(apiData(response).map(toOrder));
      } catch (e) { if (!cancelled) setError(e.message); }
    };
    const timer = window.setInterval(refreshUnreadCounts, 10000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [screen]);
  const latestChatMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    if (screen !== "chat") return;
    const messageList = chatMessagesRef.current;
    if (messageList) messageList.scrollTop = messageList.scrollHeight;
  }, [screen, selectedOrder?.order_id, latestChatMessageId]);

  const visibleOrders = useMemo(() => orders.filter((o) => {
    const text = `${o.id} ${o.customer}`.toLowerCase();
    if (!text.includes(query.toLowerCase())) return false;
    if (filter === "pending") return ["PENDING_ACCEPT", "PENDING_PAYMENT"].includes(o.status);
    if (filter === "preparing") return o.status === "PREPARING";
    if (filter === "done") return ["READY_FOR_DELIVERY", "IN_DELIVERY", "COMPLETED"].includes(o.status);
    return true;
  }), [orders, filter, query]);
  const unreadMessageTotal = orders.reduce((sum, order) => sum + Number(order.unreadMessageCount || 0), 0);

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
    setSavingMenu(true);
    try {
      let imageUrl = menuDraft.image_url.trim();
      if (menuImageFile) {
        const formData = new FormData();
        formData.append("image", menuImageFile);
        const upload = apiData(await apiRequest("/upload/menu-image", { method: "POST", body: formData }));
        imageUrl = upload.imageUrl;
      }
      const payload = { ...menuDraft, price: Number(menuDraft.price), image_url: imageUrl || null };
      if (editingMenuId) {
        await apiRequest(`/merchant-management/menus/${editingMenuId}`, { method: "PUT", body: payload });
      } else {
        await apiRequest("/merchant-management/menus", { method: "POST", body: { ...payload, is_available: true } });
      }
      setMenuDraft({ name: "", description: "", price: "", image_url: "" });
      setEditingMenuId(null);
      setMenuImageFile(null);
      setMenuImagePreview("");
      await refresh();
    } catch (e) { setError(e.message); }
    finally { setSavingMenu(false); }
  }
  function startEditMenu(menu) {
    setEditingMenuId(menu.id);
    setMenuDraft({ name: menu.name || "", description: menu.description || "", price: String(menu.price ?? ""), image_url: menu.image_url || "" });
    setMenuImageFile(null);
    setMenuImagePreview(menu.image_url || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function clearMenuDraft() {
    setEditingMenuId(null);
    setMenuDraft({ name: "", description: "", price: "", image_url: "" });
    setMenuImageFile(null);
    setMenuImagePreview("");
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
    try { const orderId = selectedOrder.order_id || selectedOrder.id; await apiRequest(`/orders/${orderId}/messages`, { method: "POST", body: { contentText: chatText.trim(), messageType: "TEXT" } }); setChatText(""); const r = await apiRequest(`/orders/${orderId}/messages`); const nextMessages = apiData(r) || []; setMessages(nextMessages); const latestMessageId = Math.max(0, ...nextMessages.map((message) => Number(message.id) || 0)); if (latestMessageId > lastReadChatMessageId.current) { await apiRequest(`/orders/${orderId}/messages/read`, { method: "PUT", body: { message_id: latestMessageId } }); lastReadChatMessageId.current = latestMessageId; } setOrders((current) => current.map((order) => Number(order.order_id) === Number(orderId) ? { ...order, unreadMessageCount: 0 } : order)); }
    catch (e) { setError(e.message); }
  }

  if (session?.role !== "MERCHANT") return <MerchantAuth onLogin={login} onRegister={register} error={error} />;
  return <MobileShell tone="merchant"><div className="merchant-page screen-enter">
    {error && <div className="api-error" role="alert">{error}<button onClick={() => setError("")}>×</button></div>}
    {screen === "home" && <><div className="merchant-profile"><div className="avatar peach">🏪</div><div><b>{profile?.store_name || "ร้านค้า"}</b><small>{profile?.is_approved ? (profile.is_open ? "เปิดร้านอยู่" : "ปิดร้านอยู่") : "รอผู้ดูแลอนุมัติ"}</small></div><button onClick={toggleStore} disabled={!profile?.is_approved}>{profile?.is_open ? "ปิดร้าน" : "เปิดร้าน"}</button></div><SearchBar value={query} onChange={setQuery} placeholder="ค้นหาออเดอร์"/><div className="merchant-stats"><div><b>{orders.length}</b><small>ออเดอร์ทั้งหมด</small></div><div><b>{money(orders.filter((o) => o.status === "COMPLETED").reduce((n, o) => n + o.total, 0))} ฿</b><small>ยอดออเดอร์สำเร็จ</small></div></div><div className="section-header"><b>ออเดอร์ล่าสุด</b><button onClick={() => setScreen("orders")}>ดูทั้งหมด ›</button></div>{orders.slice(0, 5).map((o) => <button className="merchant-recent" key={o.id} onClick={() => { setSelectedOrder(o); setScreen("orders"); }}><div><b>{o.customer}</b><small>{o.id} · {statusLabel[o.status] || o.status}</small></div><strong>{money(o.total)} ฿</strong></button>)}{!orders.length && <EmptyState title="ยังไม่มีออเดอร์" text={loading ? "กำลังโหลดข้อมูล" : "ออเดอร์จากลูกค้าจะแสดงที่นี่"}/>}<div className="section-header"><b>เมนูร้าน</b><button onClick={() => setScreen("menu")}>จัดการเมนู ›</button></div></>}
    {screen === "orders" && <>
      <TopBar title="ออเดอร์" onBack={() => setScreen("home")}/>
      <SearchBar value={query} onChange={setQuery} placeholder="ค้นหาออเดอร์"/>
      <div className="filter-scroll merchant-filters">{[["all","ทั้งหมด"],["pending","รอรับ/ชำระ"],["preparing","กำลังทำ"],["done","พร้อมส่ง/สำเร็จ"]].map(([k,l]) => <button key={k} className={filter===k?"active":""} onClick={() => setFilter(k)}>{l}</button>)}</div>
      {visibleOrders.map((o) => <div className="merchant-order-card" key={o.id}>
        <div className="order-head"><div><b>{o.customer}</b><small>{o.id} · {o.time}</small></div><strong>{money(o.total)} ฿</strong></div>
        <div className="order-items">{o.items.map((x,i)=><span key={i}>• {x}</span>)}</div>
        <div className="order-footer"><StatusPill tone={statusTone[o.status] || "yellow"}>{statusLabel[o.status] || o.status}</StatusPill><div>
          {o.status === "PENDING_ACCEPT" && <><button className="status-action-green" onClick={() => changeStatus(o,"PENDING_PAYMENT")}>รับออเดอร์</button><button className="status-action-red" onClick={() => changeStatus(o,"REJECTED_BY_MERCHANT")}>ปฏิเสธ</button></>}
          {o.status === "PENDING_PAYMENT" && <small className="status-message-yellow">รอลูกค้าชำระเงิน</small>}
          {o.status === "PAID" && <button className="accept-button" onClick={() => changeStatus(o,"PREPARING")}>เริ่มทำอาหาร</button>}
          {o.status === "PREPARING" && <button className="accept-button" onClick={() => changeStatus(o,"READY_FOR_DELIVERY")}>พร้อมส่ง</button>}
          {o.status === "READY_FOR_DELIVERY" && <button className="accept-button" onClick={() => changeStatus(o,"IN_DELIVERY")}>เริ่มจัดส่ง</button>}
          {o.status === "IN_DELIVERY" && <button className="accept-button" onClick={() => changeStatus(o,"COMPLETED")}>ส่งสำเร็จ</button>}
          <button className="merchant-chat-button" onClick={() => { setSelectedOrder(o); setScreen("chat"); }}>แชท{o.unreadMessageCount > 0&&<span className="unread-chat-badge">{o.unreadMessageCount > 9 ? "9+" : o.unreadMessageCount}</span>}</button>
        </div></div>
      </div>)}
      {!visibleOrders.length && <EmptyState title="ไม่พบออเดอร์" text="ลองเปลี่ยนตัวกรองหรือค้นหาใหม่"/>}
    </>}
    {screen === "menu" && <>
      <TopBar title="จัดการเมนู" onBack={() => setScreen("home")}/>
      <div className={editingMenuId ? "merchant-menu-edit-overlay" : "merchant-menu-inline"} onMouseDown={(event)=>{if(event.target===event.currentTarget)clearMenuDraft();}}>
      <div className={editingMenuId ? "merchant-menu-edit-dialog" : "merchant-menu-inline-content"} role={editingMenuId ? "dialog" : undefined} aria-modal={editingMenuId ? "true" : undefined} aria-labelledby={editingMenuId ? "merchant-menu-editor-title" : undefined}>
      {editingMenuId&&<button type="button" className="merchant-menu-edit-close" aria-label="ปิดหน้าต่างแก้ไขเมนู" onClick={clearMenuDraft}>×</button>}
      <form className="merchant-order-card merchant-menu-form" onSubmit={saveMenu}>
        <div className="merchant-menu-form-head"><div><span className="menu-form-kicker">{editingMenuId ? "แก้ไขเมนู" : "เมนูใหม่"}</span><h3 id={editingMenuId ? "merchant-menu-editor-title" : undefined}>{editingMenuId ? "ปรับรายละเอียดเมนู" : "เพิ่มเมนูของร้าน"}</h3><p>เพิ่มภาพและรายละเอียดให้น่ากดสั่ง พร้อมตั้งราคาได้ที่นี่</p></div></div>
        <div className="merchant-menu-upload-wrap"><label className="merchant-menu-upload">{menuImagePreview ? <img src={menuImagePreview} alt="ตัวอย่างรูปเมนู"/> : <span className="menu-upload-placeholder"><b>＋</b><strong>เพิ่มรูปเมนู</strong><small>JPG, PNG หรือ WebP</small></span>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event)=>{const file=event.target.files?.[0]||null;event.currentTarget.value="";setMenuImageFile(file);setMenuDraft((current)=>({...current,image_url:""}));setMenuImagePreview(file?URL.createObjectURL(file):"");}}/><span className="menu-upload-edit">{menuImagePreview?"เปลี่ยนรูป":"เลือกรูป"}</span></label>{menuImagePreview&&<button type="button" className="menu-image-remove" onClick={()=>{setMenuDraft((current)=>({...current,image_url:""}));setMenuImageFile(null);setMenuImagePreview("");}}>ลบรูป</button>}</div>
        <div className="merchant-menu-fields">
          <label>ชื่อเมนู<input required placeholder="เช่น ข้าวกะเพราไข่ดาว" value={menuDraft.name} onChange={(e)=>setMenuDraft({...menuDraft,name:e.target.value})}/></label>
          <label>รายละเอียด<input placeholder="รายละเอียดหรือส่วนประกอบ" value={menuDraft.description} onChange={(e)=>setMenuDraft({...menuDraft,description:e.target.value})}/></label>
          <label>ราคา (บาท)<input required type="number" min="0" step="0.01" placeholder="ราคา" value={menuDraft.price} onChange={(e)=>setMenuDraft({...menuDraft,price:e.target.value})}/></label>
          <label>หรือลิงก์รูปภาพ<input type="url" placeholder="https://..." value={menuDraft.image_url} onChange={(e)=>{const value=e.target.value;setMenuDraft({...menuDraft,image_url:value});setMenuImageFile(null);setMenuImagePreview(value);}}/></label>
        </div>
        <div className="merchant-menu-form-actions"><button disabled={savingMenu} className="primary-btn">{savingMenu?"กำลังบันทึก…":editingMenuId?"บันทึกการแก้ไข":"เพิ่มเมนู"}</button>{editingMenuId&&<button type="button" className="menu-action-delete" onClick={clearMenuDraft}>ยกเลิก</button>}</div>
      </form>
      </div>
      </div>
      <div className="merchant-menu-grid">{menus.map((m) => <article className="merchant-menu-card" key={m.id}>
        <div className="merchant-menu-card-photo">{m.image_url?<img src={m.image_url} alt={m.name} loading="lazy"/>:<span>🍽️</span>}<span className={`merchant-menu-state ${m.is_available?"available":"paused"}`}>{m.is_available?"กำลังขาย":"หยุดขาย"}</span></div>
        <div className="merchant-menu-card-content"><div className="merchant-menu-title"><div><h3>{m.name}</h3><p>{m.description || "เมนูอร่อยจากร้านของคุณ"}</p></div><strong>{money(m.price)} <small>฿</small></strong></div>
          <div className="merchant-menu-actions"><button className="menu-action-primary" onClick={()=>startEditMenu(m)}>แก้ไขเมนู</button><button onClick={async()=>{try{await apiRequest(`/merchant-management/menus/${m.id}/availability`,{method:"PATCH",body:{is_available:!m.is_available}});await refresh();}catch(e){setError(e.message);}}}>{m.is_available?"หยุดขาย":"เปิดขาย"}</button><button className="menu-action-delete" onClick={async()=>{if(!window.confirm(`ลบเมนู ${m.name}?`))return;try{await apiRequest(`/merchant-management/menus/${m.id}`,{method:"DELETE"});if(editingMenuId===m.id)clearMenuDraft();await refresh();}catch(e){setError(e.message);}}}>ลบเมนู</button><MerchantMenuOptions menu={m} onError={(message)=>setError(message)}/></div>
        </div>
      </article>)}</div>
      {!menus.length && <EmptyState title="ยังไม่มีเมนู" text="เพิ่มเมนูแรกของร้านได้จากแบบฟอร์มด้านบน"/>}
    </>}
    {screen === "delivery" && <><TopBar title="ค่าจัดส่ง" onBack={() => setScreen("home")}/><form className="delivery-fee-box" onSubmit={saveFee}><h3>กำหนดค่าจัดส่งตามซอย</h3><select required value={feeDraft.soi_id} onChange={(e)=>setFeeDraft({...feeDraft,soi_id:e.target.value})}><option value="">เลือกซอย</option>{sois.map((s)=><option value={s.id} key={s.id}>{s.name}</option>)}</select><input required type="number" min="0" step="0.01" placeholder="ค่าจัดส่ง (บาท)" value={feeDraft.fee} onChange={(e)=>setFeeDraft({...feeDraft,fee:e.target.value})}/><button className="primary-btn">บันทึกค่าจัดส่ง</button></form>{fees.map((f)=><div className="merchant-order-card" key={f.id}>{f.soi_name}<strong>{money(f.fee)} ฿</strong></div>)}</>}
    {screen === "chat" && <><TopBar title="แชทออเดอร์" subtitle={selectedOrder?.id} onBack={() => setScreen("orders")}/><div className="chat-panel"><div ref={chatMessagesRef} className="chat-messages short">{messages.map((m)=><div className={`chat-bubble ${m.is_merchant_sender ? "me" : "store"}`} key={m.id}>{m.content_text}</div>)}{!messages.length && <EmptyState title="ยังไม่มีข้อความ" text="เริ่มสนทนากับลูกค้าของออเดอร์นี้"/>}</div><form className="chat-compose" onSubmit={sendChat}><input value={chatText} onChange={(e)=>setChatText(e.target.value)} placeholder="เขียนข้อความ..."/><button>➤</button></form></div></>}
    {screen === "profile" && <><TopBar title="ข้อมูลร้าน" onBack={() => setScreen("home")}/><div className="merchant-order-card"><h3>{profile?.store_name}</h3><p>{profile?.location || "ยังไม่ได้ระบุที่ตั้ง"}</p><p>{profile?.promptpay_id || "ยังไม่ได้ระบุ PromptPay"}</p><p>{profile?.is_approved ? "อนุมัติแล้ว" : "รอการอนุมัติจากผู้ดูแล"}</p><button onClick={async()=>{const next=window.prompt("ชื่อร้าน",profile?.store_name||"");if(!next)return;try{await apiRequest("/merchant-management/profile",{method:"PUT",body:{store_name:next,location:profile?.location,promptpay_id:profile?.promptpay_id,store_image_url:profile?.store_image_url}});await refresh();}catch(e){setError(e.message);}}}>แก้ไขชื่อร้าน</button></div><form className="merchant-order-card" onSubmit={changePassword}><h3>ตั้งรหัสผ่านใหม่</h3><input required type="password" autoComplete="current-password" placeholder="รหัสผ่านปัจจุบัน" value={passwordDraft.current_password} onChange={(e)=>setPasswordDraft({...passwordDraft,current_password:e.target.value})}/><input required minLength={8} type="password" autoComplete="new-password" placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)" value={passwordDraft.new_password} onChange={(e)=>setPasswordDraft({...passwordDraft,new_password:e.target.value})}/><button className="primary-btn">เปลี่ยนรหัสผ่าน</button>{passwordMessage&&<p role="status">{passwordMessage}</p>}</form><div className="merchant-order-card"><button onClick={()=>{clearAuthSession();setSession(null);}}>ออกจากระบบ</button></div></>}
    <BottomNav tone="merchant" active={screen} onChange={(key)=>setScreen(key)} items={[{key:"home",label:"หน้าหลัก",icon:"⌂"},{key:"orders",label:"ออเดอร์",icon:"▣",badge:unreadMessageTotal},{key:"menu",label:"เมนู",icon:"☷"},{key:"delivery",label:"จัดส่ง",icon:"🛵"},{key:"profile",label:"ร้าน",icon:"♙"}]}/>
  </div></MobileShell>;
}

function MerchantAuth({ onLogin, onRegister, error }) {
  const [mode, setMode] = useState("login"); const [form, setForm] = useState({ username:"", password:"", store_name:"" }); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e) { e.preventDefault(); setBusy(true); const result = mode === "login" ? await onLogin(form) : await onRegister(form); setMessage(result || ""); setBusy(false); }
  return <MobileShell tone="merchant"><div className="merchant-page role-auth-layout"><div className="merchant-order-card role-auth-card"><h1>{mode === "login" ? "เข้าสู่ระบบร้านค้า" : "สมัครร้านค้า"}</h1><p>ใช้บัญชีร้านค้าที่เชื่อมกับระบบ</p><form onSubmit={submit}><input required minLength="3" placeholder="ชื่อผู้ใช้" value={form.username} onChange={(e)=>setForm({...form,username:e.target.value})}/><input required minLength="6" type="password" placeholder="รหัสผ่าน" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})}/>{mode === "register" && <input required minLength="2" placeholder="ชื่อร้าน" value={form.store_name} onChange={(e)=>setForm({...form,store_name:e.target.value})}/>}<button disabled={busy} className="primary-btn">{busy?"กำลังดำเนินการ...":mode==="login"?"เข้าสู่ระบบ":"สมัครร้านค้า"}</button></form>{(message||error)&&<p role="alert">{message||error}</p>}<button className="auth-switch" onClick={()=>{setMode(mode==="login"?"register":"login");setMessage("");}}>{mode==="login"?"ยังไม่มีบัญชี? สมัครร้านค้า":"มีบัญชีแล้ว? เข้าสู่ระบบ"}</button></div></div></MobileShell>;
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
  async function deleteGroup(group) {
    if (!window.confirm(`ลบกลุ่ม “${group.name}” และตัวเลือกย่อยทั้งหมดหรือไม่?`)) return;
    try { await apiRequest(`/merchant-management/menus/option-groups/${group.id}`, { method:"DELETE" }); await loadGroups(); }
    catch (e) { onError(e.message); }
  }
  async function deleteChoice(choice) {
    if (!window.confirm(`ลบตัวเลือก “${choice.name}” หรือไม่?`)) return;
    try { await apiRequest(`/merchant-management/menus/option-choices/${choice.id}`, { method:"DELETE" }); await loadGroups(); }
    catch (e) { onError(e.message); }
  }
  return <section className="menu-options-editor">
    <button type="button" className="menu-options-toggle" onClick={toggleOpen}>{open ? "ซ่อนตัวเลือกเสริม" : "จัดการตัวเลือกเสริม"}</button>
    {open&&<div className="menu-options-content"><form className="option-group-form" onSubmit={addGroup}><div><span>ตัวเลือกเสริม</span><h4>เพิ่มกลุ่มตัวเลือก</h4><p>เช่น ระดับความเผ็ด ท็อปปิง หรือเลือกเครื่องเคียง</p></div><label>ชื่อกลุ่ม<input required placeholder="เช่น เพิ่มท็อปปิง" value={groupForm.name} onChange={(e)=>setGroupForm({...groupForm,name:e.target.value})}/></label><div className="option-group-flags"><label><input type="checkbox" checked={groupForm.is_required} onChange={(e)=>setGroupForm({...groupForm,is_required:e.target.checked})}/> ต้องเลือกอย่างน้อยหนึ่งรายการ</label><label><input type="checkbox" checked={groupForm.allow_multiple} onChange={(e)=>setGroupForm({...groupForm,allow_multiple:e.target.checked})}/> เลือกได้หลายรายการ</label></div><button className="primary-btn">เพิ่มกลุ่ม</button></form>
      {groups.map((group)=><OptionGroupEditor key={group.id} group={group} onAdd={(choice)=>addChoice(group.id,choice)} onDeleteGroup={()=>deleteGroup(group)} onDeleteChoice={deleteChoice}/>) }
      {!groups.length&&<p className="empty-options-hint">ยังไม่มีกลุ่มตัวเลือกเสริมสำหรับเมนูนี้</p>}
    </div>}
  </section>;
}

function OptionGroupEditor({ group, onAdd, onDeleteGroup, onDeleteChoice }) {
  const [name, setName] = useState(""); const [price, setPrice] = useState("0");
  return <div className="option-group-editor"><div className="option-group-heading"><div><b>{group.name}</b><small>{group.is_required?"จำเป็น":"ไม่บังคับ"} · {group.allow_multiple?"เลือกหลายรายการ":"เลือกหนึ่งรายการ"}</small></div><button type="button" className="option-delete-button" onClick={onDeleteGroup}>ลบกลุ่ม</button></div><div className="option-choice-list">{(group.choices||[]).map((choice)=><div className="option-choice-row" key={choice.id}><span>{choice.name}</span><strong>+{money(choice.extra_price)} ฿</strong><button type="button" aria-label={`ลบ ${choice.name}`} onClick={()=>onDeleteChoice(choice)}>×</button></div>)}</div><form className="option-choice-form" onSubmit={(e)=>{e.preventDefault();onAdd({name,extra_price:price});setName("");setPrice("0");}}><label>ชื่อรายการ<input required placeholder="เช่น ไข่ดาว" value={name} onChange={(e)=>setName(e.target.value)}/></label><label>ราคาเพิ่ม (บาท)<input aria-label="ราคาเพิ่ม" type="number" min="0" step="0.01" value={price} onChange={(e)=>setPrice(e.target.value)}/></label><button className="primary-btn">เพิ่มตัวเลือก</button></form></div>;
}
