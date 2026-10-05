"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BottomNav, MobileShell, SearchBar, StatusPill, TopBar, EmptyState } from "../../components/AppShell";
import { customerFoods, customerMenu, initialOrders, statusLabel } from "../../data/mockData";

const categories = ["All", "Coffee & Tea", "On Order", "More"];

export default function CustomerPage() {
  const [screen, setScreen] = useState("home");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState(initialOrders[0]);
  const [savedPlace, setSavedPlace] = useState(false);
  const [profile, setProfile] = useState({ name: "นักศึกษา มจพ.", phone: "081-555-2222" });
  const [chatText, setChatText] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { from: "store", text: "สวัสดีครับ 👋" },
    { from: "me", text: "ออเดอร์ถึงไหนแล้วครับ" },
    { from: "store", text: "กำลังเตรียมอาหารให้ครับ" },
  ]);

  const cartCount = cart.reduce((s, x) => s + x.qty, 0);
  const subtotal = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const deliveryFee = subtotal ? 10 : 0;
  const total = subtotal + deliveryFee;

  const filtered = useMemo(() => customerFoods.filter((food) => {
    const matchesSearch = `${food.name} ${food.category}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || (category === "Coffee & Tea" && food.category.includes("เครื่องดื่ม")) || category === "On Order" || category === "More";
    return matchesSearch && matchesCategory;
  }), [search, category]);

  function addItem(item) {
    setCart((current) => {
      const exists = current.find((x) => x.id === item.id);
      return exists ? current.map((x) => x.id === item.id ? { ...x, qty: x.qty + 1 } : x) : [...current, { ...item, qty: 1 }];
    });
  }

  function changeQty(id, delta) {
    setCart((current) => current.map((x) => x.id === id ? { ...x, qty: x.qty + delta } : x).filter((x) => x.qty > 0));
  }

  function placeOrder() {
    const newOrder = { id: `#ORD${String(orders.length + 2).padStart(3, "0")}`, store: "ครัวหลังมอ", items: cart.map((x) => `${x.name} x${x.qty}`), total, status: "PREPARING", date: "Today, now" };
    setOrders((current) => [newOrder, ...current]);
    setSelectedOrder(newOrder);
    setCart([]);
    setScreen("recent");
  }

  function sendChat(e) {
    e?.preventDefault();
    if (!chatText.trim()) return;
    setChatMessages((m) => [...m, { from: "me", text: chatText.trim() }]);
    setChatText("");
    setTimeout(() => setChatMessages((m) => [...m, { from: "store", text: "รับทราบครับ เดี๋ยวตรวจสอบให้นะครับ" }]), 450);
  }

  const nav = (key) => {
    if (key === "order") setScreen("recent");
    else if (key === "profile") setScreen("profile");
    else setScreen("home");
  };

  return (
    <MobileShell>
      <div className="mobile-page">
        {screen === "home" && <CustomerHome search={search} setSearch={setSearch} category={category} setCategory={setCategory} foods={filtered} cartCount={cartCount} onStore={(food) => { setScreen("store"); }} onCart={() => setScreen("basket")} />}
        {screen === "store" && <CustomerStore cartCount={cartCount} onBack={() => setScreen("home")} addItem={addItem} onBasket={() => setScreen("basket")} />}
        {screen === "basket" && <Basket cart={cart} subtotal={subtotal} deliveryFee={deliveryFee} total={total} changeQty={changeQty} onBack={() => setScreen("store")} onNext={() => setScreen("update")} />}
        {screen === "update" && <UpdateBasket cart={cart} total={total} savedPlace={savedPlace} setSavedPlace={setSavedPlace} changeQty={changeQty} onBack={() => setScreen("basket")} onNext={() => setScreen("place")} />}
        {screen === "place" && <PlaceOrder cart={cart} subtotal={subtotal} deliveryFee={deliveryFee} total={total} onBack={() => setScreen("update")} onPlace={placeOrder} />}
        {screen === "recent" && <Recent orders={orders} onOpen={(order) => { setSelectedOrder(order); setScreen("delivery"); }} onHome={() => setScreen("home")} />}
        {screen === "delivery" && <Delivery order={selectedOrder} onBack={() => setScreen("recent")} onChat={() => setScreen("chat")} />}
        {screen === "profile" && <Profile profile={profile} savedPlace={savedPlace} onBack={() => setScreen("home")} onSave={() => setScreen("save-place")} onLogin={() => setScreen("login")} onUpdateProfile={setProfile} />}
        {screen === "save-place" && <SavePlace saved={savedPlace} onBack={() => setScreen("profile")} onSave={() => { setSavedPlace(true); setScreen("profile"); }} />}
        {screen === "chat" && <CustomerChat messages={chatMessages} value={chatText} setValue={setChatText} onSend={sendChat} onBack={() => setScreen("delivery")} />}
        {screen === "login" && <CustomerAuth mode="login" onBack={() => setScreen("profile")} onSuccess={() => setScreen("home")} onSignUp={() => setScreen("signup")} />}
        {screen === "signup" && <CustomerAuth mode="signup" onBack={() => setScreen("profile")} onSuccess={() => setScreen("home")} onLogin={() => setScreen("login")} />}
      </div>
      <BottomNav tone="orange" active={screen === "profile" ? "profile" : ["recent", "delivery"].includes(screen) ? "order" : "home"} onChange={nav} items={[{ key: "home", label: "Home", icon: "⌂" }, { key: "order", label: "Order", icon: "▣" }, { key: "profile", label: "Profile", icon: "♙" }, { key: "cart", label: cartCount ? `Cart (${cartCount})` : "Cart", icon: "🛒" }]} />
      <button className="floating-cart-button" onClick={() => setScreen("basket")}>🛒 {cartCount ? `${cartCount} · ${total} ฿` : "0 ฿"}</button>
    </MobileShell>
  );
}

function CustomerHome({ search, setSearch, category, setCategory, foods, onStore, onCart }) {
  return <>
    <div className="customer-header"><div className="avatar peach">👤</div><div className="customer-user"><b>นักศึกษา มจพ.</b><small>หอพักมหาวิทยาลัย มจพ.</small></div><button>♡</button><button onClick={onCart}>🛒</button></div>
    <SearchBar value={search} onChange={setSearch} placeholder="Search ?" />
    <div className="filter-scroll">{categories.map((c) => <button className={category === c ? "active" : ""} key={c} onClick={() => setCategory(c)}>{c}</button>)}</div>
    <SectionHeader title="Order now!" />
    <div className="food-grid">{foods.map((food) => <button className="food-card" key={food.id} onClick={() => onStore(food)}><div className="food-photo">{food.emoji}</div><b>{food.name}</b><small>{food.category}</small><span>⭐ {food.rating} · {food.price} ฿</span></button>)}</div>
    <SectionHeader title="Recent" />
    <div className="recent-compact"><div className="food-thumb">🍛</div><div><b>ครัวหลังมอ</b><small>ข้าวกะเพราไก่ · 90 ฿</small></div><span>Completed</span></div>
  </>;
}
function SectionHeader({ title }) { return <div className="section-header"><b>{title}</b><button>See all ›</button></div>; }
function CustomerStore({ onBack, addItem, onBasket, cartCount }) {
  return <>
    <TopBar title="ครัวหลังมอ" subtitle="อาหารตามสั่ง" onBack={onBack} action={<button className="topbar-cart" onClick={onBasket}>🛒 {cartCount}</button>} />
    <div className="store-hero"><div className="store-photo-large">🍛</div><div className="store-info"><b>ครัวหลังมอ</b><small>Delivery · est. 34 mins · ⭐ 4.8</small></div><button className="store-heart">♡</button></div>
    <div className="sub-section"><b>For You</b><small>เมนูแนะนำ</small></div>
    <div className="food-grid">{[...customerMenu, { id: 5, name: "ไก่ทอด", price: 50, emoji: "🍗" }].map((item) => <div className="food-card" key={item.id}><div className="food-photo">{item.emoji}</div><b>{item.name}</b><small>เมนูร้าน</small><div className="card-bottom"><span>{item.price} ฿</span><button onClick={() => addItem(item)}>＋</button></div></div>)}</div>
    <button className="primary-btn" onClick={onBasket}>Update Basket <span>{cartCount} items</span></button>
  </>;
}
function Basket({ cart, subtotal, deliveryFee, total, changeQty, onBack, onNext }) {
  return <><TopBar title="My Cart" onBack={onBack} /><div className="cart-shop"><div className="food-thumb">🍛</div><div><b>ครัวหลังมอ</b><small>Delivery · est. 34 mins</small></div></div>{cart.length ? cart.map((item) => <div className="cart-row" key={item.id}><div className="food-thumb">{item.emoji}</div><div className="cart-row-info"><b>{item.name}</b><small>{item.price} ฿</small></div><div className="qty"><button onClick={() => changeQty(item.id,-1)}>−</button><span>{item.qty}</span><button onClick={() => changeQty(item.id,1)}>＋</button></div></div>) : <EmptyState title="Your basket is empty" text="กลับไปที่ร้านเพื่อเลือกเมนู" />}<Summary subtotal={subtotal} delivery={deliveryFee} total={total} /><button className="primary-btn" disabled={!cart.length} onClick={onNext}>Update Basket →</button></>;
}
function UpdateBasket({ cart, total, savedPlace, setSavedPlace, changeQty, onBack, onNext }) {
  return <><TopBar title="Update Basket" onBack={onBack} action={<b className="orange-text">{total} ฿</b>} /><div className="order-card"><div className="cart-shop"><div className="food-thumb">🍛</div><div><b>ครัวหลังมอ</b><small>Delivery · est. 34 mins</small></div></div>{cart.map((item) => <div className="simple-line" key={item.id}><span>{item.name}</span><div className="qty"><button onClick={() => changeQty(item.id,-1)}>−</button><span>{item.qty}</span><button onClick={() => changeQty(item.id,1)}>＋</button></div></div>)}</div><label className="field"><b>Note to restaurant</b><input placeholder="Add your request here" /></label><label className="check-line"><input type="checkbox" checked={savedPlace} onChange={(e) => setSavedPlace(e.target.checked)} /> Save my place</label><button className="primary-btn" onClick={onNext}>Update Basket → {total} ฿</button></>;
}
function PlaceOrder({ cart, subtotal, deliveryFee, total, onBack, onPlace }) {
  return <><TopBar title="Order Summary" onBack={onBack} /><div className="summary-card-big"><div className="cart-shop"><div className="food-thumb">🍛</div><div><b>ครัวหลังมอ</b><small>Delivery · 34 mins</small></div></div>{cart.map((item) => <div className="summary-item" key={item.id}><span>{item.name} x{item.qty}</span><b>{item.price * item.qty} ฿</b></div>)}<Summary subtotal={subtotal} delivery={deliveryFee} total={total} /></div><div className="payment-card"><b>Payment method</b><div>◉ PromptPay <span>›</span></div></div><button className="primary-btn" onClick={onPlace}>Place order <span>· {total} ฿</span></button></>;
}
function Summary({ subtotal, delivery, total }) { return <div className="summary"><div><span>Subtotal</span><b>{subtotal} ฿</b></div><div><span>Delivery fee</span><b>{delivery} ฿</b></div><hr/><div className="total"><span>Total</span><strong>{total} ฿</strong></div></div>; }
function Recent({ orders, onOpen, onHome }) {
  return <><TopBar title="Recent" onBack={onHome} /><div className="list-title"><b>Recent Orders</b><span>{orders.length}</span></div>{orders.map((order) => <button className="recent-order-row" key={order.id} onClick={() => onOpen(order)}><div className="food-thumb">{order.status === "COMPLETED" ? "🍽️" : "🍛"}</div><div className="recent-main"><b>{order.store}</b><small>{order.items.join(" · ")}</small><span>{order.date}</span></div><div className="recent-right"><b>{order.total} ฿</b><small className={order.status === "COMPLETED" ? "green-text" : "orange-text"}>{statusLabel[order.status]}</small></div></button>)}</>;
}
function Delivery({ order, onBack, onChat }) {
  const steps = ["PENDING_ACCEPT", "PREPARING", "READY_FOR_DELIVERY", "IN_DELIVERY", "COMPLETED"];
  const index = Math.max(0, steps.indexOf(order?.status || "PREPARING"));
  return <><TopBar title={`Order ${order?.id || "#ORD001"}`} onBack={onBack} action={<button className="topbar-btn">⋮</button>} /><div className="delivery-card"><div className="delivery-order-head"><div><b>Order {order?.id || "#ORD001"}</b><small>{order?.date || "Today, 10:25"}</small></div><strong>{order?.total || 90} ฿</strong></div>{steps.map((step, i) => <div className={`delivery-step ${i <= index ? "done" : ""}`} key={step}><div className="step-dot">{i <= index ? "✓" : "•"}</div><div><b>{statusLabel[step]}</b><small>{i === index ? "Current status" : i < index ? "Completed" : "Waiting"}</small></div></div>)}</div><div className="restaurant-line"><div className="food-thumb">🍛</div><div><b>ครัวหลังมอ</b><small>ร้านอาหาร · 34 mins</small></div><span>⭐ 4.8</span></div><button className="secondary-btn" onClick={onChat}>Chat with Restaurant</button></>;
}
function Profile({ profile, savedPlace, onBack, onSave, onLogin, onUpdateProfile }) {
  return <><TopBar title="Profile" onBack={onBack} /><div className="profile-card-top"><div className="profile-cover"></div><div className="profile-avatar">👤</div><div className="profile-text"><b>{profile.name}</b><small>{profile.phone}</small></div></div><div className="profile-menu"><button onClick={onSave}><span>📍 Saved place</span><b>{savedPlace ? "Saved" : "›"}</b></button><button><span>⚙ Settings</span><b>›</b></button><button onClick={onLogin}><span>⇥ Sign in</span><b>›</b></button><button className="danger"><span>↪ Log out</span><b>›</b></button></div></>;
}
function SavePlace({ saved, onBack, onSave }) {
  return <><TopBar title="Add a place" onBack={onBack} /><div className="form-card"><h2>Add a place</h2><label>Name / Place<input defaultValue={saved ? "หอพักมหาวิทยาลัย มจพ." : ""} placeholder="e.g. Dorm" /></label><label>Address<input placeholder="Street / building" /></label><label>Note<input placeholder="Additional details" /></label><button className="primary-btn" onClick={onSave}>Save place</button></div></>;
}
function CustomerChat({ messages, value, setValue, onSend, onBack }) {
  return <><div className="chat-top"><button onClick={onBack}>‹</button><div><b>ครัวหลังมอ</b><small>online</small></div><span>☎</span></div><div className="chat-messages">{messages.map((m,i)=><div className={`chat-bubble ${m.from === "me" ? "me" : "store"}`} key={i}>{m.text}</div>)}</div><form className="chat-compose" onSubmit={onSend}><input value={value} onChange={(e)=>setValue(e.target.value)} placeholder="เขียนข้อความ..."/><button>➤</button></form></>;
}
function CustomerAuth({ mode, onBack, onSuccess, onSignUp, onLogin }) {
  return <div className="auth-page"><button className="auth-back" onClick={onBack}>‹</button><div className="auth-art">🍕 🍟 🥤 🍗</div><div className="auth-panel"><h2>{mode === "login" ? "Sign in" : "Sign up"}</h2><input placeholder="Email / Phone" /><input placeholder="Password" type="password" />{mode === "signup" && <input placeholder="Confirm password" type="password" />}<button className="primary-btn" onClick={onSuccess}>{mode === "login" ? "Sign in" : "Sign up"}</button><small>{mode === "login" ? "Forgot your password?" : "Already have an account?"}</small><button className="text-link" onClick={mode === "login" ? onSignUp : onLogin}>{mode === "login" ? "Sign up" : "Sign in"}</button></div><div className="social-row"><button>G Google</button><button>● Line</button></div></div>;
}
