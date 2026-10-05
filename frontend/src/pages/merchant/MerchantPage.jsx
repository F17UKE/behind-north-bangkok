"use client";

import { useMemo, useState } from "react";
import { BottomNav, MobileShell, SearchBar, StatusPill, TopBar, EmptyState } from "../../components/AppShell";
import { merchantOrdersSeed, statusLabel } from "../../data/mockData";

export default function MerchantPage() {
  const [screen, setScreen] = useState("home");
  const [orders, setOrders] = useState(merchantOrdersSeed);
  const [orderFilter, setOrderFilter] = useState("all");
  const [deliveryFee, setDeliveryFee] = useState("30");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState("นักศึกษา มจพ.");
  const [chatText, setChatText] = useState("");

  const filteredOrders = useMemo(() => orders.filter((o) => {
    const q = `${o.id} ${o.customer}`.toLowerCase();
    if (!q.includes(query.toLowerCase())) return false;
    if (orderFilter === "pending") return o.status === "PENDING_ACCEPT";
    if (orderFilter === "preparing") return o.status === "PREPARING";
    if (orderFilter === "done") return ["READY_FOR_DELIVERY", "COMPLETED"].includes(o.status);
    return true;
  }), [orders, orderFilter, query]);

  const updateOrder = (id, status) => setOrders((current) => current.map((o) => o.id === id ? { ...o, status } : o));
  const sendChat = (e) => { e.preventDefault(); if (!chatText.trim()) return; setMessages((m) => [...m, { user: selectedChat, from: "merchant", text: chatText }]); setChatText(""); };

  return <MobileShell tone="merchant"><div className="merchant-page">
    {screen === "home" && <MerchantHome orders={orders} go={setScreen} query={query} setQuery={setQuery} />}
    {screen === "orders" && <MerchantOrders orders={filteredOrders} filter={orderFilter} setFilter={setOrderFilter} query={query} setQuery={setQuery} onBack={()=>setScreen("home")} updateOrder={updateOrder} />}
    {screen === "delivery" && <MerchantDelivery orders={orders} deliveryFee={deliveryFee} setDeliveryFee={setDeliveryFee} onBack={()=>setScreen("home")} />}
    {screen === "chat" && <MerchantChat selected={selectedChat} setSelected={setSelectedChat} messages={messages} value={chatText} setValue={setChatText} onSend={sendChat} onBack={()=>setScreen("home")} />}
  </div><BottomNav tone="merchant" active={screen} onChange={(key)=>setScreen(key)} items={[{key:"home",label:"Home",icon:"⌂"},{key:"orders",label:"Order",icon:"▣"},{key:"delivery",label:"Delivery",icon:"🛵"},{key:"chat",label:"Chat",icon:"💬"}]} /></MobileShell>;
}

function MerchantHome({ orders, go, query, setQuery }) {
  return <>
    <div className="merchant-profile"><div className="avatar peach">👤</div><div><b>แอดมินร้านครัวหลังมอ</b><small>ครัวหลังมอ · เปิดร้าน</small></div><button>☰</button></div>
    <SearchBar value={query} onChange={setQuery} placeholder="Search..." />
    <div className="merchant-quick"><button>All</button><button>Unread <span>0</span></button><button>Favorites</button><button>Quick Reply</button></div>
    <div className="merchant-stats"><div><b>24</b><small>Order Today</small><em>+XX%</em></div><div><b>1,560</b><small>Revenue Today</small><em>+XX%</em></div></div>
    <div className="section-header"><b>Recent orders</b><button onClick={()=>go("orders")}>See all ›</button></div>
    {orders.map((o)=><button className="merchant-recent" key={o.id} onClick={()=>go("orders")}><div className="food-thumb">🍛</div><div><b>{o.customer}</b><small>{o.id} · {statusLabel[o.status]}</small></div><strong>{o.total} ฿</strong></button>)}
  </>;
}
function MerchantOrders({ orders, filter, setFilter, query, setQuery, onBack, updateOrder }) {
  return <><TopBar title="การสั่ง" subtitle="Order section" onBack={onBack} /><SearchBar value={query} onChange={setQuery} placeholder="Search order..." /><div className="filter-scroll merchant-filters"><button className={filter==="all"?"active":""} onClick={()=>setFilter("all")}>การสั่งซื้อทั้งหมด</button><button className={filter==="pending"?"active":""} onClick={()=>setFilter("pending")}>กำลังรอรับ</button><button className={filter==="preparing"?"active":""} onClick={()=>setFilter("preparing")}>กำลังทำ</button><button className={filter==="done"?"active":""} onClick={()=>setFilter("done")}>เสร็จแล้ว</button></div>{orders.length ? orders.map((o)=><div className="merchant-order-card" key={o.id}><div className="order-head"><div><b>{o.customer}</b><small>Order ID: {o.id} · {o.time}</small></div><strong>{o.total} ฿</strong></div><div className="order-items">{o.items.map((x)=><span key={x}>• {x}</span>)}</div><div className="order-footer"><StatusPill tone={o.status === "PENDING_ACCEPT" ? "orange" : o.status === "PREPARING" ? "yellow" : "green"}>{statusLabel[o.status]}</StatusPill><div>{o.status === "PENDING_ACCEPT" && <button className="accept-button" onClick={()=>updateOrder(o.id,"PREPARING")}>รับออเดอร์</button>}{o.status === "PREPARING" && <button className="accept-button" onClick={()=>updateOrder(o.id,"READY_FOR_DELIVERY")}>พร้อมจัดส่ง</button>}</div></div></div>) : <EmptyState title="No orders" text="ไม่มีออเดอร์ตามตัวกรอง" />}</>;
}
function MerchantDelivery({ orders, deliveryFee, setDeliveryFee, onBack }) {
  const ready = orders.filter((o)=>["READY_FOR_DELIVERY","IN_DELIVERY","COMPLETED"].includes(o.status));
  return <><TopBar title="Delivery" subtitle="Delivery section" onBack={onBack} /><div className="delivery-fee-box"><h3>Delivery fees</h3><input value={deliveryFee} onChange={(e)=>setDeliveryFee(e.target.value.replace(/\D/g,""))} /><div className="range-track"><i /></div><button className="primary-btn">Submit</button></div><div className="section-header"><b>Delivery orders</b><span>{ready.length}</span></div>{ready.map((o)=><div className="merchant-order-card compact" key={o.id}><div className="order-head"><div><b>{o.id}</b><small>{o.customer}</small></div><StatusPill tone="green">{statusLabel[o.status]}</StatusPill></div><strong>{o.total} ฿</strong></div>)}</>;
}
function MerchantChat({ selected, setSelected, messages, value, setValue, onSend, onBack }) {
  const contacts=["นักศึกษา มจพ.","Petchtae","Thanakrit","Napat","บ้านหลังมอ","Chonlatit"];
  return <><TopBar title="Chat" subtitle="Chat section" onBack={onBack} /><div className="merchant-chat-layout"><div className="contact-list">{contacts.map((c)=><button className={selected===c?"selected":""} key={c} onClick={()=>setSelected(c)}><div className="avatar small">👤</div><div><b>{c}</b><small>{c===selected?"ข้อความล่าสุด...":"Order message..."}</small></div><span>1:52 PM</span></button>)}</div><div className="chat-panel"><div className="chat-panel-top"><div className="avatar small">👤</div><div><b>{selected}</b><small>online</small></div></div><div className="chat-messages short">{messages.filter((m)=>m.user===selected).map((m,i)=><div className="chat-bubble me" key={i}>{m.text}</div>)}<div className="chat-bubble store">สวัสดีครับ ต้องการสอบถามอะไรไหมครับ?</div></div><form className="chat-compose" onSubmit={onSend}><input value={value} onChange={(e)=>setValue(e.target.value)} placeholder="เขียนข้อความ..."/><button>➤</button></form></div></div></>;
}
