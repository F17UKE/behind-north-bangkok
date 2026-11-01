"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BottomNav, MobileShell, SearchBar, TopBar, EmptyState } from "../../components/AppShell";
import { customerFoods, initialOrders, statusLabel } from "../../data/mockData";
import "./CustomerStorefront.css";

const categories = ["All", "Coffee & Tea", "On Order", "More"];
const menuGallery = customerFoods.flatMap((store) => store.menu.map((item) => ({ ...item, storeName: store.name, store })));
const heroMenuGallery = menuGallery.filter((item) => [101, 501, 601, 701, 801, 901, 1001, 1101, 1201, 1501].includes(item.id));
const customizationOptions = {
  rice: [{ id: "fried-egg", name: "เพิ่มไข่ดาว", price: 12 }, { id: "omelet", name: "เพิ่มไข่เจียว", price: 15 }, { id: "extra-meat", name: "เพิ่มเนื้อสัตว์", price: 20 }, { id: "extra-rice", name: "เพิ่มข้าว", price: 10 }, { id: "crispy-garlic", name: "กระเทียมเจียว", price: 5 }],
  noodles: [{ id: "extra-noodle", name: "เพิ่มเส้น", price: 10 }, { id: "extra-meat", name: "เพิ่มเนื้อสัตว์", price: 20 }, { id: "meatball", name: "เพิ่มลูกชิ้น", price: 15 }, { id: "egg", name: "เพิ่มไข่ต้ม", price: 12 }, { id: "crispy-garlic", name: "กระเทียมเจียว", price: 5 }],
  salad: [{ id: "extra-shrimp", name: "เพิ่มกุ้ง", price: 25 }, { id: "extra-pork", name: "เพิ่มหมูยอ", price: 20 }, { id: "salted-egg", name: "เพิ่มไข่เค็ม", price: 15 }, { id: "rice-noodle", name: "เพิ่มขนมจีน", price: 10 }, { id: "extra-veggie", name: "เพิ่มผัก", price: 10 }],
  drink: [{ id: "pearls", name: "ไข่มุก", price: 10 }, { id: "pudding", name: "พุดดิ้ง", price: 15 }, { id: "jelly", name: "วุ้น", price: 10 }, { id: "espresso", name: "เพิ่มช็อตกาแฟ", price: 15 }, { id: "whipped-cream", name: "วิปครีม", price: 15 }],
  dessert: [{ id: "coconut", name: "เพิ่มกะทิ", price: 10 }, { id: "ice-cream", name: "ไอศกรีม", price: 20 }, { id: "sticky-rice", name: "เพิ่มข้าวเหนียว", price: 15 }, { id: "fruit", name: "เพิ่มผลไม้", price: 20 }],
  burger: [{ id: "cheese", name: "เพิ่มชีส", price: 15 }, { id: "bacon", name: "เพิ่มเบคอน", price: 25 }, { id: "patty", name: "เพิ่มเนื้อ/ไก่", price: 30 }, { id: "egg", name: "เพิ่มไข่ดาว", price: 12 }, { id: "fries", name: "เพิ่มเฟรนช์ฟรายส์", price: 25 }],
  seafood: [{ id: "seafood-dip", name: "น้ำจิ้มซีฟู้ดเพิ่ม", price: 10 }, { id: "extra-shrimp", name: "เพิ่มกุ้ง", price: 35 }, { id: "extra-squid", name: "เพิ่มปลาหมึก", price: 30 }, { id: "rice", name: "เพิ่มข้าวสวย", price: 12 }],
  brunch: [{ id: "egg", name: "เพิ่มไข่ดาว", price: 12 }, { id: "bacon", name: "เพิ่มเบคอน", price: 25 }, { id: "cheese", name: "เพิ่มชีส", price: 15 }, { id: "coffee", name: "เพิ่มกาแฟ 1 ช็อต", price: 15 }, { id: "fruit", name: "เพิ่มผลไม้", price: 20 }],
  hotpot: [{ id: "pork", name: "เพิ่มหมูสไลซ์", price: 35 }, { id: "beef", name: "เพิ่มเนื้อสไลซ์", price: 45 }, { id: "vegetable", name: "เพิ่มผักรวม", price: 25 }, { id: "egg", name: "เพิ่มไข่ไก่", price: 10 }, { id: "noodles", name: "เพิ่มวุ้นเส้น", price: 10 }],
};

export default function CustomerPage() {
  const [screen, setScreen] = useState("home");
  const [selectedStore, setSelectedStore] = useState(customerFoods[0]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [heroIndex, setHeroIndex] = useState(0);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState(initialOrders[0]);
  const [savedPlace, setSavedPlace] = useState(false);
  const [profile, setProfile] = useState({ name: "นักศึกษา มจพ.", phone: "081-555-2222" });
  const [chatText, setChatText] = useState("");
  const [customItem, setCustomItem] = useState(null);
  const [customAddons, setCustomAddons] = useState([]);
  const [customNote, setCustomNote] = useState("");
  const [customQty, setCustomQty] = useState(1);
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
    const menuNames = food.menu.map((item) => item.name).join(" ");
    const matchesSearch = `${food.name} ${food.category} ${menuNames}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || (category === "Coffee & Tea" && food.category.includes("เครื่องดื่ม")) || category === "On Order" || category === "More";
    return matchesSearch && matchesCategory;
  }), [search, category]);

  useEffect(() => {
    if (screen !== "home") return undefined;
    const root = document.querySelector(".customer-home");
    if (!root) return undefined;

    const targets = root.querySelectorAll("[data-scroll-reveal]");
    root.classList.add("reveal-ready");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("reveal-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reveal-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -35px 0px" });
    targets.forEach((target, index) => {
      target.style.setProperty("--reveal-delay", `${Math.min(index, 5) * 75}ms`);
      observer.observe(target);
    });

    let frame = 0;
    const updateScrollMotion = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0;
        root.style.setProperty("--scroll-distance", `${Math.min(window.scrollY, 360)}px`);
        root.style.setProperty("--scroll-progress", `${progress * 100}%`);
      });
    };
    window.addEventListener("scroll", updateScrollMotion, { passive: true });
    updateScrollMotion();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateScrollMotion);
      if (frame) window.cancelAnimationFrame(frame);
      root.classList.remove("reveal-ready");
    };
  }, [screen, filtered]);

  useEffect(() => {
    if (screen !== "home" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => setHeroIndex((index) => (index + 1) % heroMenuGallery.length), 5200);
    return () => window.clearInterval(timer);
  }, [screen]);

  function addItem(item) {
    setCart((current) => {
      const key = item.cartLineId || String(item.id);
      const exists = current.find((x) => (x.cartLineId || String(x.id)) === key);
      return exists ? current.map((x) => (x.cartLineId || String(x.id)) === key ? { ...x, qty: x.qty + (item.qty || 1) } : x) : [...current, { ...item, qty: item.qty || 1 }];
    });
  }

  function changeQty(id, delta) {
    setCart((current) => current.map((x) => (x.cartLineId || x.id) === id ? { ...x, qty: x.qty + delta } : x).filter((x) => x.qty > 0));
  }

  function openCustomization(item, store) {
    const inferred = item.customizationType || (store.category.includes("เครื่องดื่ม") ? "drink" : store.category.includes("ของหวาน") ? "dessert" : "rice");
    setCustomItem({ ...item, storeId: store.id, storeName: store.name, customizationType: inferred });
    setCustomAddons([]);
    setCustomNote("");
    setCustomQty(1);
  }

  function confirmCustomization() {
    if (!customItem) return;
    const options = customizationOptions[customItem.customizationType] || customizationOptions.rice;
    const selected = options.filter((option) => customAddons.includes(option.id));
    const price = customItem.price + selected.reduce((sum, option) => sum + option.price, 0);
    const cartLineId = `${customItem.id}:${customAddons.slice().sort().join(",")}:${customNote.trim()}`;
    addItem({ ...customItem, basePrice: customItem.price, price, selectedAddons: selected, note: customNote.trim(), cartLineId, qty: customQty });
    setCustomItem(null);
  }

  function placeOrder() {
    const newOrder = { id: `#ORD${String(orders.length + 2).padStart(3, "0")}`, store: cart[0]?.storeName || "ครัวหลังมอ", items: cart.map((x) => `${x.name}${x.selectedAddons?.length ? ` (${x.selectedAddons.map((option) => option.name).join(", ")})` : ""}${x.note ? ` · หมายเหตุ: ${x.note}` : ""} x${x.qty}`), total, status: "PREPARING", date: "Today, now" };
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
    else if (key === "cart") setScreen("basket");
    else setScreen("home");
  };

  function openStore(store) {
    setSelectedStore(store);
    setScreen("store");
  }

  return (
    <MobileShell>
      <div key={screen} className="mobile-page customer-page-shell screen-enter">
        {screen === "home" && <CustomerHome search={search} setSearch={setSearch} category={category} setCategory={setCategory} foods={filtered} menu={menuGallery} featured={heroMenuGallery[heroIndex]} heroIndex={heroIndex} setHeroIndex={setHeroIndex} heroCount={heroMenuGallery.length} cartCount={cartCount} onStore={openStore} onCart={() => setScreen("basket")} onOrders={() => setScreen("recent")} onProfile={() => setScreen("profile")} />}
        {screen === "store" && <CustomerStore store={selectedStore} cartCount={cartCount} onBack={() => setScreen("home")} onCustomize={openCustomization} onBasket={() => setScreen("basket")} />}
        {screen === "basket" && <Basket cart={cart} subtotal={subtotal} deliveryFee={deliveryFee} total={total} changeQty={changeQty} onBack={() => setScreen("store")} onNext={() => setScreen("update")} />}
        {screen === "update" && <UpdateBasket cart={cart} total={total} savedPlace={savedPlace} setSavedPlace={setSavedPlace} changeQty={changeQty} onBack={() => setScreen("basket")} onNext={() => setScreen("place")} />}
        {screen === "place" && <PlaceOrder cart={cart} subtotal={subtotal} deliveryFee={deliveryFee} total={total} onBack={() => setScreen("update")} onPlace={placeOrder} />}
        {screen === "recent" && <Recent orders={orders} onOpen={(order) => { setSelectedOrder(order); setScreen("delivery"); }} onHome={() => setScreen("home")} />}
        {screen === "delivery" && <Delivery order={selectedOrder} onBack={() => setScreen("recent")} onChat={() => setScreen("chat")} />}
        {screen === "profile" && <Profile profile={profile} savedPlace={savedPlace} onBack={() => setScreen("home")} onSave={() => setScreen("save-place")} onLogin={() => setScreen("login")} onUpdateProfile={setProfile} />}
        {screen === "save-place" && <SavePlace saved={savedPlace} onBack={() => setScreen("profile")} onSave={() => { setSavedPlace(true); setScreen("profile"); }} />}
        {screen === "chat" && <CustomerChat storeName={selectedOrder?.store} messages={chatMessages} value={chatText} setValue={setChatText} onSend={sendChat} onBack={() => setScreen("delivery")} />}
        {screen === "login" && <CustomerAuth mode="login" onBack={() => setScreen("profile")} onSuccess={() => setScreen("home")} onSignUp={() => setScreen("signup")} />}
        {screen === "signup" && <CustomerAuth mode="signup" onBack={() => setScreen("profile")} onSuccess={() => setScreen("home")} onLogin={() => setScreen("login")} />}
      </div>
      <BottomNav tone="orange" active={screen === "profile" ? "profile" : ["recent", "delivery"].includes(screen) ? "order" : "home"} onChange={nav} items={[{ key: "home", label: "หน้าแรก", icon: "⌂" }, { key: "order", label: "ออเดอร์", icon: "▣" }, { key: "profile", label: "โปรไฟล์", icon: "♙" }, { key: "cart", label: cartCount ? `ตะกร้า (${cartCount})` : "ตะกร้า", icon: "🛒" }]} />
      <button className="floating-cart-button" onClick={() => setScreen("basket")}>🛒 {cartCount ? `${cartCount} · ${total} ฿` : "0 ฿"}</button>
      {customItem && <CustomizationModal item={customItem} options={customizationOptions[customItem.customizationType] || customizationOptions.rice} selected={customAddons} setSelected={setCustomAddons} note={customNote} setNote={setCustomNote} qty={customQty} setQty={setCustomQty} onClose={() => setCustomItem(null)} onConfirm={confirmCustomization} />}
    </MobileShell>
  );
}

function CustomerHome({ search, setSearch, category, setCategory, foods, menu, featured, heroIndex, setHeroIndex, heroCount, cartCount, onStore, onCart, onOrders, onProfile }) {
  return <div className="customer-home">
    <div className="storefront-progress" aria-hidden="true" />
    <header className="storefront-nav">
      <Link className="storefront-brand" href="/customer" aria-label="Behind North หน้าแรก"><span>BN</span><b>Behind North</b></Link>
      <div className="storefront-address"><span className="address-pin">⌖</span><div><small>จัดส่งถึง</small><b>หอพักมหาวิทยาลัย มจพ.</b></div><span className="address-chevron">⌄</span></div>
      <div className="storefront-search"><SearchBar value={search} onChange={setSearch} placeholder="ค้นหาร้านหรือเมนู" /></div>
      <nav className="storefront-links"><button onClick={onOrders}>รายการสั่งซื้อ</button><button onClick={onProfile}>บัญชีของฉัน</button></nav>
      <button className="storefront-cart" onClick={onCart}><span>ตะกร้าของฉัน</span><b>🛒</b>{cartCount > 0 && <i>{cartCount}</i>}</button>
    </header>

    <section className="customer-hero" data-scroll-reveal>
      <div className="hero-copy"><span className="hero-eyebrow"><i /> อร่อยใกล้ มจพ.</span><h1>มื้อนี้<br />ให้เรา <em>จัดให้</em></h1><p>รวมร้านโปรดแถวมหาวิทยาลัย<br className="desktop-break" /> ส่งตรงถึงหอ อร่อยง่ายในไม่กี่คลิก</p><button className="hero-cta" onClick={() => onStore(featured.store)}>สั่ง {featured.name} <span>↗</span></button><div className="hero-note"><span>✦</span> ร้านเด็ด ส่งไว เริ่มต้นเพียง 40 บาท</div></div>
      <div className="hero-photo hero-stage"><div className="hero-orbit hero-orbit-one" /><div className="hero-orbit hero-orbit-two" /><div className="hero-dish-frame" key={featured.id}><img className="hero-dish" src={featured.image} alt={featured.name} /><span className="hero-dish-glint" /></div><div className="hero-photo-label"><span>เมนูแนะนำ · {featured.storeName}</span><b>{featured.name}</b><small>ปรุงสดจากร้านใกล้คุณ <strong>฿{featured.price}</strong></small></div><div className="hero-slide-controls" aria-label="เลือกเมนูแนะนำ"><button onClick={() => setHeroIndex((heroIndex - 1 + heroCount) % heroCount)} aria-label="เมนูก่อนหน้า">‹</button>{heroMenuGallery.map((item, index) => <button key={item.id} className={index === heroIndex ? "active" : ""} onClick={() => setHeroIndex(index)} aria-label={`แสดงเมนู ${item.name}`} />)}<button onClick={() => setHeroIndex((heroIndex + 1) % heroCount)} aria-label="เมนูถัดไป">›</button></div></div>
      <div className="hero-index"><b>{String(heroIndex + 1).padStart(2, "0")}</b><span /> {String(heroCount).padStart(2, "0")}</div>
    </section>

    <section className="discovery-section" data-scroll-reveal>
      <div className="section-heading"><div><span className="section-kicker">เลือกตามใจ</span><h2>วันนี้อยากกินอะไร?</h2></div><a href="#popular">สำรวจร้านทั้งหมด <span>→</span></a></div>
      <div className="customer-categories">{categories.map((c, i) => <button className={category === c ? "active" : ""} key={c} onClick={() => setCategory(c)}><span>{["✳", "☕", "↻", "＋"][i]}</span>{c === "All" ? "ทั้งหมด" : c === "Coffee & Tea" ? "กาแฟและชา" : c === "On Order" ? "สั่งบ่อย" : "เพิ่มเติม"}</button>)}</div>
    </section>

    <section className="discovery-section popular-section" id="popular" data-scroll-reveal><div className="section-heading"><div><span className="section-kicker">คัดมาให้แล้ว</span><h2>ร้านยอดนิยมใกล้คุณ</h2></div><a href="#popular">ดูร้านทั้งหมด <span>→</span></a></div>
      <div className="food-grid">{foods.map((food, index) => <button className={`food-card editorial-card card-tone-${index + 1}`} data-scroll-reveal key={food.id} onClick={() => onStore(food)}><div className="shop-photo"><img src={food.photo} alt={`${food.name} ร้านอาหาร`} loading={index < 2 ? "eager" : "lazy"} /><span className="shop-status">เปิดอยู่</span><i>↗</i></div><div className="editorial-card-info"><small className="food-category">{food.category}</small><b>{food.name}</b><div className="food-meta"><span>★ {food.rating}</span><i /><span>{food.delivery}</span><strong>เริ่ม ฿{food.price}</strong></div><div className="shop-tag-row">{food.tags.map((tag) => <small key={tag}>{tag}</small>)}</div></div></button>)}</div>
    </section>

    <section className="discovery-section menu-section" id="menu" data-scroll-reveal>
      <div className="section-heading"><div><span className="section-kicker">อร่อยทุกคำ คัดมาแล้ว</span><h2>เมนูที่น่าลอง</h2></div><span className="menu-section-note">เลื่อนลงมาเจอจานโปรดของคุณ</span></div>
      <div className="menu-gallery-grid">{menu.map((item, index) => <article className="menu-card" data-scroll-reveal key={item.id}>
        <button className="menu-photo-button" onClick={() => onStore(item.store)} aria-label={`ดูเมนูร้าน ${item.storeName}: ${item.name}`}><img src={item.image} alt={item.name} loading={index < 4 ? "eager" : "lazy"} /><span>↗</span></button>
        <div className="menu-card-info"><div><small>{item.storeName}</small><b>{item.name}</b></div><div className="menu-card-meta"><span>★ {item.store.rating}</span><b>฿{item.price}</b></div></div>
      </article>)}</div>
    </section>

    <section className="repeat-order" data-scroll-reveal><div className="repeat-icon">↻</div><div><span className="section-kicker">อยากกินอีกแล้ว</span><b>สั่งร้านเดิมอีกครั้ง</b><small>ครัวหลังมอ · ข้าวกะเพราไก่ · 90 บาท</small></div><button onClick={() => foods[0] && onStore(foods[0])}>สั่งซ้ำ <span>→</span></button></section>
  </div>;
}
function CustomerStore({ store, onBack, onCustomize, onBasket, cartCount }) {
  return <div className="restaurant-detail">
    <TopBar title={store.name} subtitle={store.category} onBack={onBack} action={<button className="topbar-cart" onClick={onBasket}>🛒 {cartCount}</button>} />
    <div className="store-hero"><div className="store-photo-large"><img src={store.photo} alt={`${store.name} เมนูแนะนำ`} /><span className="store-open-pill">เปิดให้บริการ</span></div><div className="store-info"><div><b>{store.name}</b><small>{store.category}</small></div><div className="store-meta-line"><span>★ {store.rating}</span><i /><span>{store.delivery}</span><i /><span>{store.fee}</span></div><div className="store-detail-tags">{store.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div></div>
    <div className="restaurant-menu-heading"><div><small>ทำสดทุกจาน</small><b>เมนูของร้าน</b></div><span>{store.menu.length} เมนู</span></div>
    <div className="store-menu-grid">{store.menu.map((item) => <article className="store-menu-item" key={item.id}><div className="store-menu-photo"><img src={item.image} alt={item.name} loading="lazy" /></div><div className="store-menu-item-info"><div><b>{item.name}</b><small>{item.description}</small></div><div className="store-menu-item-bottom"><strong>฿{item.price}</strong><button onClick={() => onCustomize(item, store)} aria-label={`ปรับแต่ง ${item.name}`}>＋</button></div><small className="customize-hint">ปรับแต่งเมนูได้</small></div></article>)}</div>
    <button className="primary-btn store-cart-cta" onClick={onBasket}>ดูตะกร้า <span>{cartCount} รายการ</span></button>
  </div>;
}
function CustomizationModal({ item, options, selected, setSelected, note, setNote, qty, setQty, onClose, onConfirm }) {
  const addonsTotal = options.filter((option) => selected.includes(option.id)).reduce((sum, option) => sum + option.price, 0);
  const toggle = (id) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  return <div className="customize-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="customize-dialog" role="dialog" aria-modal="true" aria-labelledby="customize-title"><button className="customize-close" onClick={onClose} aria-label="ปิด">×</button><div className="customize-product"><img src={item.image} alt={item.name} /><div><small>ปรับแต่งเมนู</small><h2 id="customize-title">{item.name}</h2><span>฿{item.price}</span></div></div><div className="customize-section-heading"><b>เพิ่มความอร่อย</b><small>เลือกได้หลายรายการ</small></div><div className="customize-options">{options.map((option) => <label className="customize-option" key={option.id}><input type="checkbox" checked={selected.includes(option.id)} onChange={() => toggle(option.id)} /><span>{option.name}</span><b>+฿{option.price}</b></label>)}</div><label className="customize-note"><b>หมายเหตุถึงร้าน</b><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="เช่น ไม่ใส่ผัก เผ็ดน้อย แยกน้ำซอส" maxLength={180} /><small>{note.length}/180</small></label><div className="customize-footer"><div className="qty customize-qty"><button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button onClick={() => setQty(qty + 1)}>＋</button></div><button className="primary-btn" onClick={onConfirm}>เพิ่มลงตะกร้า · ฿{(item.price + addonsTotal) * qty}</button></div></section></div>;
}
function Basket({ cart, subtotal, deliveryFee, total, changeQty, onBack, onNext }) {
  return <><TopBar title="My Cart" onBack={onBack} /><div className="cart-shop"><CartStoreThumb storeId={cart[0]?.storeId} /><div><b>{cart[0]?.storeName || "เลือกร้านค้า"}</b><small>Delivery · est. 34 mins</small></div></div>{cart.length ? cart.map((item) => <div className="cart-row" key={item.cartLineId || item.id}><div className="food-thumb cart-item-image"><img src={item.image} alt={item.name} /></div><div className="cart-row-info"><b>{item.name}</b>{item.selectedAddons?.length > 0 && <small>เพิ่ม: {item.selectedAddons.map((option) => option.name).join(", ")}</small>}{item.note && <small>หมายเหตุ: {item.note}</small>}<small>{item.price} ฿</small></div><div className="qty"><button onClick={() => changeQty(item.cartLineId || item.id,-1)}>−</button><span>{item.qty}</span><button onClick={() => changeQty(item.cartLineId || item.id,1)}>＋</button></div></div>) : <EmptyState title="Your basket is empty" text="กลับไปที่ร้านเพื่อเลือกเมนู" />}<Summary subtotal={subtotal} delivery={deliveryFee} total={total} /><button className="primary-btn" disabled={!cart.length} onClick={onNext}>Update Basket →</button></>;
}
function UpdateBasket({ cart, total, savedPlace, setSavedPlace, changeQty, onBack, onNext }) {
  return <><TopBar title="Update Basket" onBack={onBack} action={<b className="orange-text">{total} ฿</b>} /><div className="order-card"><div className="cart-shop"><CartStoreThumb storeId={cart[0]?.storeId} /><div><b>{cart[0]?.storeName || "เลือกร้านค้า"}</b><small>Delivery · est. 34 mins</small></div></div>{cart.map((item) => <div className="simple-line" key={item.cartLineId || item.id}><div><span>{item.name}</span>{item.selectedAddons?.length > 0 && <small className="order-custom-detail"> + {item.selectedAddons.map((option) => option.name).join(", ")}</small>}{item.note && <small className="order-custom-detail">หมายเหตุ: {item.note}</small>}</div><div className="qty"><button onClick={() => changeQty(item.cartLineId || item.id,-1)}>−</button><span>{item.qty}</span><button onClick={() => changeQty(item.cartLineId || item.id,1)}>＋</button></div></div>)}</div><label className="check-line"><input type="checkbox" checked={savedPlace} onChange={(e) => setSavedPlace(e.target.checked)} /> Save my place</label><button className="primary-btn" onClick={onNext}>Update Basket → {total} ฿</button></>;
}
function PlaceOrder({ cart, subtotal, deliveryFee, total, onBack, onPlace }) {
  return <><TopBar title="Order Summary" onBack={onBack} /><div className="summary-card-big"><div className="cart-shop"><CartStoreThumb storeId={cart[0]?.storeId} /><div><b>{cart[0]?.storeName || "เลือกร้านค้า"}</b><small>Delivery · 34 mins</small></div></div>{cart.map((item) => <div className="summary-item" key={item.cartLineId || item.id}><span>{item.name} x{item.qty}{item.selectedAddons?.length > 0 && <small className="order-custom-detail"> + {item.selectedAddons.map((option) => option.name).join(", ")}</small>}{item.note && <small className="order-custom-detail">หมายเหตุ: {item.note}</small>}</span><b>{item.price * item.qty} ฿</b></div>)}<Summary subtotal={subtotal} delivery={deliveryFee} total={total} /></div><div className="payment-card"><b>Payment method</b><div>◉ PromptPay <span>›</span></div></div><button className="primary-btn" onClick={onPlace}>Place order <span>· {total} ฿</span></button></>;
}
function CartStoreThumb({ storeId }) {
  const store = customerFoods.find((item) => item.id === storeId);
  return <div className="food-thumb cart-store-image"><img src={store?.photo || "/store-kitchen.webp"} alt={store?.name || "ร้านอาหาร"} /></div>;
}
function Summary({ subtotal, delivery, total }) { return <div className="summary"><div><span>Subtotal</span><b>{subtotal} ฿</b></div><div><span>Delivery fee</span><b>{delivery} ฿</b></div><hr/><div className="total"><span>Total</span><strong>{total} ฿</strong></div></div>; }
function Recent({ orders, onOpen, onHome }) {
  return <><TopBar title="Recent" onBack={onHome} /><div className="list-title"><b>Recent Orders</b><span>{orders.length}</span></div>{orders.map((order) => <button className="recent-order-row" key={order.id} onClick={() => onOpen(order)}><div className="food-thumb">{order.status === "COMPLETED" ? "🍽️" : "🍛"}</div><div className="recent-main"><b>{order.store}</b><small>{order.items.join(" · ")}</small><span>{order.date}</span></div><div className="recent-right"><b>{order.total} ฿</b><small className={order.status === "COMPLETED" ? "green-text" : "orange-text"}>{statusLabel[order.status]}</small></div></button>)}</>;
}
function Delivery({ order, onBack, onChat }) {
  const steps = ["PENDING_ACCEPT", "PREPARING", "READY_FOR_DELIVERY", "IN_DELIVERY", "COMPLETED"];
  const index = Math.max(0, steps.indexOf(order?.status || "PREPARING"));
  return <><TopBar title={`Order ${order?.id || "#ORD001"}`} onBack={onBack} action={<button className="topbar-btn">⋮</button>} /><div className="delivery-card"><div className="delivery-order-head"><div><b>Order {order?.id || "#ORD001"}</b><small>{order?.date || "Today, 10:25"}</small></div><strong>{order?.total || 90} ฿</strong></div>{steps.map((step, i) => <div className={`delivery-step ${i <= index ? "done" : ""}`} key={step}><div className="step-dot">{i <= index ? "✓" : "•"}</div><div><b>{statusLabel[step]}</b><small>{i === index ? "Current status" : i < index ? "Completed" : "Waiting"}</small></div></div>)}</div><div className="restaurant-line"><div className="food-thumb">🍛</div><div><b>{order?.store || "ครัวหลังมอ"}</b><small>ร้านอาหาร · 34 mins</small></div><span>⭐ 4.8</span></div><button className="secondary-btn" onClick={onChat}>Chat with Restaurant</button></>;
}
function Profile({ profile, savedPlace, onBack, onSave, onLogin, onUpdateProfile }) {
  return <><TopBar title="Profile" onBack={onBack} /><div className="profile-card-top"><div className="profile-cover"></div><div className="profile-avatar">👤</div><div className="profile-text"><b>{profile.name}</b><small>{profile.phone}</small></div></div><div className="profile-menu"><button onClick={onSave}><span>📍 Saved place</span><b>{savedPlace ? "Saved" : "›"}</b></button><button><span>⚙ Settings</span><b>›</b></button><button onClick={onLogin}><span>⇥ Sign in</span><b>›</b></button><button className="danger"><span>↪ Log out</span><b>›</b></button></div></>;
}
function SavePlace({ saved, onBack, onSave }) {
  return <><TopBar title="Add a place" onBack={onBack} /><div className="form-card"><h2>Add a place</h2><label>Name / Place<input defaultValue={saved ? "หอพักมหาวิทยาลัย มจพ." : ""} placeholder="e.g. Dorm" /></label><label>Address<input placeholder="Street / building" /></label><label>Note<input placeholder="Additional details" /></label><button className="primary-btn" onClick={onSave}>Save place</button></div></>;
}
function CustomerChat({ storeName, messages, value, setValue, onSend, onBack }) {
  return <><div className="chat-top"><button onClick={onBack}>‹</button><div><b>{storeName || "ครัวหลังมอ"}</b><small>online</small></div><span>☎</span></div><div className="chat-messages">{messages.map((m,i)=><div className={`chat-bubble ${m.from === "me" ? "me" : "store"}`} key={i}>{m.text}</div>)}</div><form className="chat-compose" onSubmit={onSend}><input value={value} onChange={(e)=>setValue(e.target.value)} placeholder="เขียนข้อความ..."/><button>➤</button></form></>;
}
function CustomerAuth({ mode, onBack, onSuccess, onSignUp, onLogin }) {
  return <div className="auth-page"><button className="auth-back" onClick={onBack}>‹</button><div className="auth-art">🍕 🍟 🥤 🍗</div><div className="auth-panel"><h2>{mode === "login" ? "Sign in" : "Sign up"}</h2><input placeholder="Email / Phone" /><input placeholder="Password" type="password" />{mode === "signup" && <input placeholder="Confirm password" type="password" />}<button className="primary-btn" onClick={onSuccess}>{mode === "login" ? "Sign in" : "Sign up"}</button><small>{mode === "login" ? "Forgot your password?" : "Already have an account?"}</small><button className="text-link" onClick={mode === "login" ? onSignUp : onLogin}>{mode === "login" ? "Sign up" : "Sign in"}</button></div><div className="social-row"><button>G Google</button><button>● Line</button></div></div>;
}
