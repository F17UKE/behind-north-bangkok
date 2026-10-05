"use client";

import { useMemo, useState } from "react";

const food = [
  { id: 1, name: "ครัวหลังมอ", sub: "อาหารตามสั่ง", price: 45, rating: 4.8, emoji: "🍛" },
  { id: 2, name: "MIXE RUMM", sub: "อาหาร / เครื่องดื่ม", price: 50, rating: 4.7, emoji: "🍜" },
  { id: 3, name: "กะเพราหมู", sub: "อาหารตามสั่ง", price: 45, rating: 4.9, emoji: "🥘" },
  { id: 4, name: "ข้าวไก่ทอด", sub: "ของทอด", price: 55, rating: 4.6, emoji: "🍗" }
];

const menu = [
  { id: 1, name: "ข้าวกะเพราไก่", price: 45, emoji: "🌶️" },
  { id: 2, name: "ข้าวไข่เจียว", price: 35, emoji: "🍳" },
  { id: 3, name: "กะเพราหมูสับ", price: 45, emoji: "🥘" },
  { id: 4, name: "ไข่ดาว", price: 10, emoji: "🍳" }
];

const initialOrders = [
  { id: "#ORD001", store: "ครัวหลังมอ", items: ["ข้าวกะเพราไก่ x1", "ข้าวไข่เจียว x1"], total: 90, status: "PREPARING" },
  { id: "#ORD000", store: "ครัวหลังมอ", items: ["ข้าวกะเพราไก่ x1"], total: 55, status: "COMPLETED" }
];

const statusLabel = {
  PENDING_ACCEPT: "รอร้านรับออเดอร์",
  PENDING_PAYMENT: "รอชำระเงิน",
  PREPARING: "กำลังเตรียมอาหาร",
  READY_FOR_DELIVERY: "พร้อมจัดส่ง",
  IN_DELIVERY: "กำลังจัดส่ง",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED_BY_CUSTOMER: "ยกเลิกโดยลูกค้า"
};

const merchantOrdersSeed = [
  { id: "#ORD001", customer: "นักศึกษา มจพ.", total: 90, status: "PREPARING", items: ["ข้าวกะเพราไก่ x1", "ข้าวไข่เจียว x1"], time: "10:25" },
  { id: "#ORD002", customer: "Petchtae", total: 75, status: "PENDING_ACCEPT", items: ["ข้าวกะเพราไก่ x1", "น้ำเปล่า x1"], time: "10:20" },
  { id: "#ORD003", customer: "Thanakrit", total: 120, status: "COMPLETED", items: ["ข้าวหมูกรอบ x2"], time: "10:15" }
];

const adminUsers = [
  { name: "นักศึกษา มจพ.", phone: "084-444-4444", role: "User", status: "active" },
  { name: "Petchtae", phone: "081-222-3333", role: "Merchant", status: "active" },
  { name: "Thanakrit", phone: "081-333-4444", role: "User", status: "active" },
  { name: "Napat", phone: "082-444-5555", role: "User", status: "blocked" },
  { name: "หอพักหลังมอ", phone: "083-555-6666", role: "Merchant", status: "active" }
];

export default function Home() {
  const [role, setRole] = useState(null);

  if (role === "customer") return <Customer onExit={() => setRole(null)} />;
  if (role === "merchant") return <Merchant onExit={() => setRole(null)} />;
  if (role === "admin") return <Admin onExit={() => setRole(null)} />;

  return <RolePicker choose={setRole} />;
}

function RolePicker({ choose }) {
  return (
    <main className="role-page">
      <div className="role-inner">
        <div className="brand-square">BN</div>
        <div className="eyebrow">HYPERLOCAL FOOD DELIVERY</div>
        <h1>Behind <span>North Bangkok</span></h1>
        <p className="role-sub">
          Frontend prototype ตาม Figma ของ Behind NB
          สำหรับลูกค้า ร้านค้า และแอดมิน
        </p>

        <div className="role-cards">
          <button className="role-card orange" onClick={() => choose("customer")}>
            <div className="role-icon">🍔</div>
            <div>
              <h2>ลูกค้า</h2>
              <p>ค้นหาร้าน สั่งอาหาร ติดตามออเดอร์ และแชทร้าน</p>
            </div>
            <strong>เข้าสู่ระบบ →</strong>
          </button>

          <button className="role-card green" onClick={() => choose("merchant")}>
            <div className="role-icon">🏪</div>
            <div>
              <h2>ร้านค้า</h2>
              <p>จัดการออเดอร์ การจัดส่ง เมนู และแชท</p>
            </div>
            <strong>เข้าสู่ระบบ →</strong>
          </button>

          <button className="role-card blue" onClick={() => choose("admin")}>
            <div className="role-icon">🛡️</div>
            <div>
              <h2>แอดมิน</h2>
              <p>จัดการผู้ใช้ ร้านค้า ออเดอร์ และ Support</p>
            </div>
            <strong>เข้าสู่ระบบ →</strong>
          </button>
        </div>
      </div>
    </main>
  );
}

/* ---------------- Customer ---------------- */

function Customer({ onExit }) {
  const [screen, setScreen] = useState("home");
  const [auth, setAuth] = useState("none");
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState(initialOrders[0]);
  const [savedPlace, setSavedPlace] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const delivery = subtotal > 0 ? 10 : 0;
  const total = subtotal + delivery;

  const addItem = (item) => {
    setCart((current) => {
      const found = current.find((x) => x.id === item.id);
      if (found) {
        return current.map((x) => x.id === item.id ? { ...x, qty: x.qty + 1 } : x);
      }
      return [...current, { ...item, qty: 1 }];
    });
  };

  const changeQty = (id, delta) => {
    setCart((current) =>
      current
        .map((x) => x.id === id ? { ...x, qty: x.qty + delta } : x)
        .filter((x) => x.qty > 0)
    );
  };

  const placeOrder = () => {
    const newOrder = {
      id: `#ORD${String(orders.length + 2).padStart(3, "0")}`,
      store: "ครัวหลังมอ",
      items: cart.map((x) => `${x.name} x${x.qty}`),
      total,
      status: "PREPARING"
    };
    setOrders((current) => [newOrder, ...current]);
    setSelectedOrder(newOrder);
    setCart([]);
    setScreen("recent");
  };

  const nav = (target) => {
    setAuth("none");
    setScreen(target);
  };

  if (auth === "login") {
    return (
      <PhoneFrame title="Sign in" onExit={onExit}>
        <AuthScreen type="login" onSuccess={() => setAuth("none")} />
      </PhoneFrame>
    );
  }

  if (auth === "signup") {
    return (
      <PhoneFrame title="Sign up" onExit={onExit}>
        <AuthScreen type="signup" onSuccess={() => setAuth("none")} />
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame title="" onExit={onExit}>
      <div className="figma-screen customer-screen">
        {screen === "home" && (
          <>
            <TopUserBar onLogin={() => setAuth("login")} />
            <HomeContent
              onStore={() => setScreen("store")}
              onLogin={() => setAuth("login")}
            />
          </>
        )}

        {screen === "store" && (
          <StoreView
            cartCount={cartCount}
            onBack={() => setScreen("home")}
            addItem={addItem}
            onBasket={() => setScreen("basket")}
          />
        )}

        {screen === "basket" && (
          <BasketView
            cart={cart}
            subtotal={subtotal}
            delivery={delivery}
            total={total}
            changeQty={changeQty}
            onBack={() => setScreen("store")}
            onUpdate={() => setScreen("update-basket")}
          />
        )}

        {screen === "update-basket" && (
          <UpdateBasketView
            cart={cart}
            total={total}
            savedPlace={savedPlace}
            setSavedPlace={setSavedPlace}
            changeQty={changeQty}
            onBack={() => setScreen("basket")}
            onCheckout={() => setScreen("place-order")}
          />
        )}

        {screen === "place-order" && (
          <PlaceOrderView
            cart={cart}
            subtotal={subtotal}
            delivery={delivery}
            total={total}
            onBack={() => setScreen("update-basket")}
            onPlace={placeOrder}
          />
        )}

        {screen === "recent" && (
          <RecentView orders={orders} onBack={() => setScreen("home")} onSelect={(order) => {
            setSelectedOrder(order);
            setScreen("delivery");
          }} />
        )}

        {screen === "delivery" && (
          <DeliveryView
            order={selectedOrder}
            onBack={() => setScreen("recent")}
            onChat={() => setScreen("chat")}
          />
        )}

        {screen === "profile" && (
          <ProfileView
            savedPlace={savedPlace}
            onSavePlace={() => setScreen("save-place")}
            onBack={() => setScreen("home")}
          />
        )}

        {screen === "save-place" && (
          <SavePlaceView
            savedPlace={savedPlace}
            setSavedPlace={setSavedPlace}
            onBack={() => setScreen("profile")}
          />
        )}

        {screen === "chat" && (
          <CustomerChat onBack={() => setScreen("delivery")} />
        )}

        <CustomerBottomNav active={screen} go={nav} cartCount={cartCount} />
      </div>
    </PhoneFrame>
  );
}

function TopUserBar({ onLogin }) {
  return (
    <div className="customer-top">
      <div className="mini-profile">
        <div className="mini-avatar peach">👤</div>
        <div><b>หิวกันเลย</b><small>กรุงเทพฯ / มจพ.</small></div>
      </div>
      <button className="ghost-icon" onClick={onLogin}>♧</button>
      <button className="ghost-icon" onClick={onLogin}>♡</button>
      <button className="ghost-icon" onClick={onLogin}>🛒</button>
    </div>
  );
}

function HomeContent({ onStore }) {
  return (
    <>
      <div className="search-pill">⌕ <input placeholder="Search ?" /></div>

      <div className="filter-row">
        {["All", "Coffee & Tea", "On Order", "More"].map((x, i) => (
          <button className={i === 0 ? "active" : ""} key={x}>{x}</button>
        ))}
      </div>

      <div className="section-line">
        <b>Order now!</b>
        <span>See all ›</span>
      </div>

      <div className="food-grid">
        {food.map((item) => (
          <button className="food-card" onClick={onStore} key={item.id}>
            <div className="food-image">{item.emoji}</div>
            <b>{item.name}</b>
            <small>{item.sub}</small>
            <div className="food-meta">⭐ {item.rating} · {item.price} ฿</div>
          </button>
        ))}
      </div>

      <div className="section-line">
        <b>Recent</b>
        <span>See all ›</span>
      </div>

      <div className="recent-row">
        <div className="tiny-food">🍛</div>
        <div><b>ครัวหลังมอ</b><small>ข้าวกะเพราไก่ · 90 ฿</small></div>
        <span className="green-text">Completed</span>
      </div>
    </>
  );
}

function StoreView({ onBack, addItem, onBasket, cartCount }) {
  return (
    <>
      <SubHeader title="ครัวหลังมอ" onBack={onBack} right={`🛒 ${cartCount}`} />
      <div className="hero-store">
        <div className="store-photo">🍛</div>
        <div className="store-name"><b>ครัวหลังมอ</b><small>อาหารตามสั่ง · ⭐ 4.8 · 15-25 mins</small></div>
        <button className="heart-btn">♡</button>
      </div>

      <div className="for-you"><b>For You</b><small>เมนูแนะนำจากร้าน</small></div>

      <div className="food-grid">
        {[...food, { id: 5, name: "ไก่ทอด", sub: "ของทอด", price: 50, rating: 4.7, emoji: "🍗" }].map((item) => (
          <button className="food-card" onClick={() => addItem(menu.find((m) => m.name.includes(item.name.split(" ")[0])) || menu[0])} key={item.id}>
            <div className="food-image">{item.emoji}</div>
            <b>{item.name}</b>
            <small>{item.sub}</small>
            <div className="food-meta">{item.price} ฿ <span>＋</span></div>
          </button>
        ))}
      </div>

      {cartCount > 0 && (
        <button className="cart-bar" onClick={onBasket}>
          Update Basket <b>· {cartCount} items · {cartCount === 1 ? "45" : "80"} ฿</b>
        </button>
      )}
    </>
  );
}

function BasketView({ cart, subtotal, delivery, total, changeQty, onBack, onUpdate }) {
  return (
    <>
      <SubHeader title="My Cart" onBack={onBack} />
      <div className="cart-list">
        {cart.length === 0 ? (
          <Empty text="Your basket is empty" />
        ) : cart.map((item) => (
          <div className="cart-line" key={item.id}>
            <div className="tiny-food">{item.emoji}</div>
            <div className="cart-item-name"><b>{item.name}</b><small>{item.price} ฿</small></div>
            <div className="qty"><button onClick={() => changeQty(item.id, -1)}>−</button><span>{item.qty}</span><button onClick={() => changeQty(item.id, 1)}>＋</button></div>
          </div>
        ))}
      </div>
      <div className="summary-box">
        <div>Subtotal <b>{subtotal} ฿</b></div>
        <div>Delivery fee <b>{delivery} ฿</b></div>
        <hr />
        <div className="total-line">Total <strong>{total} ฿</strong></div>
      </div>
      <button className="primary-orange" disabled={!cart.length} onClick={onUpdate}>Update Basket →</button>
    </>
  );
}

function UpdateBasketView({ cart, total, savedPlace, setSavedPlace, changeQty, onBack, onCheckout }) {
  return (
    <>
      <SubHeader title="Update Basket" onBack={onBack} right={`🍛 ${total} ฿`} />
      <div className="order-shop-head">
        <div className="shop-thumb">🍛</div>
        <div><b>ครัวหลังมอ</b><small>Delivery · est. 34 mins</small></div>
      </div>

      <div className="option-list">
        {cart.map((item) => (
          <div className="option-row" key={item.id}>
            <b>{item.name}</b>
            <div className="qty">
              <button onClick={() => changeQty(item.id, -1)}>−</button>
              <span>{item.qty}</span>
              <button onClick={() => changeQty(item.id, 1)}>＋</button>
            </div>
          </div>
        ))}
      </div>

      <div className="place-note">
        <b>Note to restaurant</b>
        <input placeholder="Add your request here" />
      </div>

      <label className="checkbox-line">
        <input type="checkbox" checked={savedPlace} onChange={(e) => setSavedPlace(e.target.checked)} />
        <span>Save my place</span>
      </label>

      <button className="primary-orange" onClick={onCheckout}>Update Basket → {total} ฿</button>
    </>
  );
}

function PlaceOrderView({ cart, subtotal, delivery, total, onBack, onPlace }) {
  return (
    <>
      <SubHeader title="Order Summary" onBack={onBack} />
      <div className="summary-card big">
        <div className="summary-title">
          <div className="tiny-food">🍛</div>
          <div><b>ครัวหลังมอ</b><small>Delivery · 34 mins</small></div>
        </div>
        {cart.map((item) => (
          <div className="summary-item" key={item.id}>
            <span>{item.name} x{item.qty}</span><b>{item.price * item.qty} ฿</b>
          </div>
        ))}
        <hr />
        <div className="summary-item"><span>Subtotal</span><b>{subtotal} ฿</b></div>
        <div className="summary-item"><span>Delivery fee</span><b>{delivery} ฿</b></div>
      </div>
      <div className="payment-box">
        <b>Payment method</b>
        <div>◉ PromptPay <span>›</span></div>
      </div>
      <button className="primary-orange" onClick={onPlace}>Place order <b>· {total} ฿</b></button>
    </>
  );
}

function RecentView({ orders, onBack, onSelect }) {
  return (
    <>
      <SubHeader title="Recent" onBack={onBack} />
      <div className="recent-orders">
        {orders.map((order) => (
          <button className="recent-order" key={order.id} onClick={() => onSelect(order)}>
            <div className="tiny-food">{order.status === "COMPLETED" ? "🍽️" : "🍛"}</div>
            <div className="recent-order-main">
              <b>{order.store}</b>
              <small>{order.items.join(" · ")}</small>
            </div>
            <div><b>{order.total} ฿</b><span className={`status-dot ${order.status === "COMPLETED" ? "complete" : ""}`}>{statusLabel[order.status]}</span></div>
          </button>
        ))}
      </div>
    </>
  );
}

function DeliveryView({ order, onBack, onChat }) {
  const steps = ["PENDING_ACCEPT", "PREPARING", "READY_FOR_DELIVERY", "IN_DELIVERY", "COMPLETED"];
  const current = Math.max(0, steps.indexOf(order?.status || "PREPARING"));

  return (
    <>
      <SubHeader title={`Order ${order?.id || "#ORD001"}`} onBack={onBack} right="⋮" />
      <div className="delivery-title">
        <b>Order {order?.id || "#ORD001"}</b>
        <small>Today · 10:25 · 90 ฿</small>
      </div>

      <div className="timeline">
        {steps.map((step, i) => (
          <div className={`timeline-row ${i <= current ? "done" : ""}`} key={step}>
            <div className="timeline-dot">{i <= current ? "✓" : "•"}</div>
            <div><b>{statusLabel[step]}</b><small>{i === current ? "Current status" : i < current ? "Completed" : "Waiting"}</small></div>
          </div>
        ))}
      </div>

      <div className="delivery-shop">
        <div className="tiny-food">🍛</div>
        <div><b>ครัวหลังมอ</b><small>พร้อมจัดส่ง · 34 mins</small></div>
      </div>

      <div className="order-total-row"><span>Total</span><strong>{order?.total || 90} ฿</strong></div>

      <button className="primary-orange" onClick={onChat}>Chat with restaurant</button>
    </>
  );
}

function ProfileView({ onSavePlace, onBack, savedPlace }) {
  return (
    <>
      <SubHeader title="Profile" onBack={onBack} />
      <div className="profile-card">
        <div className="profile-banner"><div className="profile-photo">👤</div></div>
        <div className="profile-body">
          <b>นักศึกษา มจพ.</b>
          <small>081-555-2222</small>
        </div>
      </div>
      <div className="settings-list">
        <button onClick={onSavePlace}><span>📍 Saved place</span><span>{savedPlace ? "Saved" : "›"}</span></button>
        <button><span>⚙ Settings</span><span>›</span></button>
        <button className="danger-row"><span>↪ Log out</span><span>›</span></button>
      </div>
    </>
  );
}

function SavePlaceView({ savedPlace, setSavedPlace, onBack }) {
  return (
    <>
      <SubHeader title="Add a place" onBack={onBack} />
      <div className="form-card">
        <h3>Add a place</h3>
        <label>Name / Place<input defaultValue={savedPlace ? "หอพักมหาวิทยาลัย มจพ." : ""} placeholder="e.g. Dorm" /></label>
        <label>Address<input placeholder="Street / building" /></label>
        <label>Note<input placeholder="Additional details" /></label>
        <button className="primary-orange" onClick={() => { setSavedPlace(true); onBack(); }}>Save place</button>
      </div>
    </>
  );
}

function CustomerChat({ onBack }) {
  return (
    <>
      <div className="chat-header peach-header">
        <button onClick={onBack}>‹</button>
        <div><b>ครัวหลังมอ</b><small>ออนไลน์</small></div>
        <span>☎</span>
      </div>
      <div className="chat-messages">
        <div className="chat-bubble left">สวัสดีครับ 👋</div>
        <div className="chat-bubble right">ออเดอร์ถึงไหนแล้วครับ</div>
        <div className="chat-bubble left">กำลังเตรียมอาหารให้ครับ</div>
        <div className="chat-bubble right">ขอบคุณครับ</div>
      </div>
      <div className="chat-input"><input placeholder="เขียนข้อความ..." /><button>➤</button></div>
    </>
  );
}

function CustomerBottomNav({ active, go, cartCount }) {
  return (
    <div className="bottom-nav">
      <button className={active === "home" ? "active" : ""} onClick={() => go("home")}>⌂<small>Home</small></button>
      <button className={active === "recent" || active === "delivery" ? "active" : ""} onClick={() => go("recent")}>▣<small>Order</small></button>
      <button onClick={() => go("chat")}>♧<small>Chat</small></button>
      <button className={active === "profile" ? "active" : ""} onClick={() => go("profile")}>♙<small>Profile</small></button>
      <button onClick={() => go("basket")} className="cart-nav">🛒<small>Cart {cartCount > 0 ? `(${cartCount})` : ""}</small></button>
    </div>
  );
}

function AuthScreen({ type, onSuccess }) {
  const signup = type === "signup";
  return (
    <div className="auth-screen">
      <div className="auth-art">
        <span>🍕</span><span>🥤</span><span>🍟</span><span>🍗</span>
      </div>
      <div className="auth-card">
        <h2>{signup ? "Sign up" : "Sign in"}</h2>
        <input placeholder="Email / Phone" />
        <input placeholder="Password" type="password" />
        {signup && <><input placeholder="Confirm password" type="password" /><input placeholder="Phone" /></>}
        <button className="primary-orange" onClick={onSuccess}>{signup ? "Sign up" : "Sign in"}</button>
        <small className="auth-link">{signup ? "Already have an account? Sign in" : "Forgot your password?"}</small>
      </div>
      <div className="auth-social"><button>G Google</button><button>● Line</button></div>
    </div>
  );
}

/* ---------------- Merchant ---------------- */

function Merchant({ onExit }) {
  const [screen, setScreen] = useState("welcome");
  const [orders, setOrders] = useState(merchantOrdersSeed);
  const [auth, setAuth] = useState(false);

  const accept = (id) => {
    setOrders((current) => current.map((o) => o.id === id ? { ...o, status: "PREPARING" } : o));
  };

  const finish = (id) => {
    setOrders((current) => current.map((o) => o.id === id ? { ...o, status: "READY_FOR_DELIVERY" } : o));
  };

  if (screen === "welcome") {
    return (
      <PhoneFrame title="Merchant" onExit={onExit}>
        <div className="merchant-welcome">
          <div className="merchant-logo">🍔</div>
          <h1>Welcome to<br /><span>Behind North Bangkok</span></h1>
          <p>"Local bites, straight to your dorm"</p>
          <div className="welcome-cards">
            <div>🏪<b>จัดการร้านค้า</b><small>ข้อมูลร้านและเมนู</small></div>
            <div>▥<b>สถิติการขาย</b><small>ยอดขายและออเดอร์</small></div>
            <div>💬<b>ติดต่อสื่อสาร</b><small>แชทกับลูกค้า</small></div>
          </div>
          <button className="primary-orange full" onClick={() => setScreen("main")}>เริ่มใช้งาน</button>
        </div>
      </PhoneFrame>
    );
  }

  if (auth) {
    return (
      <PhoneFrame title="Merchant Sign in" onExit={onExit}>
        <AuthScreen type="login" onSuccess={() => setAuth(false)} />
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame title="Merchant" onExit={onExit}>
      <div className="merchant-screen">
        {screen === "main" && <MerchantMain onOrders={() => setScreen("orders")} />}
        {screen === "orders" && <MerchantOrders orders={orders} accept={accept} finish={finish} />}
        {screen === "delivery" && <MerchantDelivery orders={orders} />}
        {screen === "chat" && <MerchantChat />}
        <MerchantNav active={screen} setScreen={setScreen} />
      </div>
    </PhoneFrame>
  );
}

function MerchantMain({ onOrders }) {
  return (
    <>
      <div className="merchant-header">
        <div className="merchant-user"><div className="mini-avatar">👤</div><div><b>แอดมินร้านครัวหลังมอ</b><small>ครัวหลังมอ</small></div></div>
        <span>☰</span>
      </div>
      <div className="search-pill">⌕ <input placeholder="Search..." /><button>Quick Reply</button></div>
      <div className="merchant-summary">
        <div><b>24</b><small>Order today</small></div>
        <div><b>1,560</b><small>Revenue today</small></div>
      </div>
      <div className="merchant-section-title"><b>Recent orders</b><button onClick={onOrders}>See all ›</button></div>
      {merchantOrdersSeed.map((order) => (
        <div className="merchant-order-row" key={order.id}>
          <div className="tiny-food">🍛</div>
          <div><b>{order.customer}</b><small>{order.id} · {statusLabel[order.status]}</small></div>
          <strong>{order.total} ฿</strong>
        </div>
      ))}
    </>
  );
}

function MerchantOrders({ orders, accept, finish }) {
  return (
    <>
      <div className="merchant-page-title"><b>การสั่ง</b><small>Order section</small></div>
      <div className="segmented"><button className="active">การสั่งซื้อ</button><button>กำลังทำ</button><button>เสร็จแล้ว</button></div>
      {orders.map((order) => (
        <div className="merchant-order-card" key={order.id}>
          <div className="between"><div><b>{order.customer}</b><small>Order ID: {order.id}</small></div><strong>{order.total} ฿</strong></div>
          <div className="order-items">{order.items.map((x) => <span key={x}>• {x}</span>)}</div>
          <div className="order-card-footer"><span className="status">{statusLabel[order.status]}</span><div>{order.status === "PENDING_ACCEPT" && <button onClick={() => accept(order.id)} className="accept-btn">รับออเดอร์</button>}{order.status === "PREPARING" && <button onClick={() => finish(order.id)} className="accept-btn">พร้อมจัดส่ง</button>}</div></div>
        </div>
      ))}
    </>
  );
}

function MerchantDelivery({ orders }) {
  const ready = orders.filter((o) => o.status === "READY_FOR_DELIVERY" || o.status === "IN_DELIVERY" || o.status === "COMPLETED");
  return (
    <>
      <div className="merchant-page-title"><b>Delivery</b><small>Delivery section</small></div>
      <div className="delivery-fee-card"><b>Delivery fees</b><input placeholder="Amount" defaultValue="30" /><div className="fee-bar"></div><button className="primary-orange full">Submit</button></div>
      <div className="delivery-list">
        {ready.length ? ready.map((o) => <div className="merchant-order-card" key={o.id}><div className="between"><b>{o.id}</b><span className="status">{statusLabel[o.status]}</span></div><small>{o.customer}</small><b>{o.total} ฿</b></div>) : <Empty text="No delivery orders" />}
      </div>
    </>
  );
}

function MerchantChat() {
  return (
    <>
      <div className="merchant-page-title"><b>Chat</b><small>Chat section</small></div>
      <div className="chat-contact-list">
        {["นักศึกษา มจพ.", "Petchtae", "Thanakrit", "Napat", "บ้านหลังมอ"].map((x, i) => (
          <div className="merchant-contact" key={x}><div className="mini-avatar">{i % 2 ? "👨" : "👩"}</div><div><b>{x}</b><small>{i === 0 ? "ออเดอร์ #ORD001..." : "ข้อความล่าสุด..."}</small></div><span>1:52 PM</span></div>
        ))}
      </div>
      <div className="chat-composer"><input placeholder="Search message..." /><button>➤</button></div>
    </>
  );
}

function MerchantNav({ active, setScreen }) {
  return (
    <div className="merchant-nav">
      {[
        ["main", "⌂", "Home"],
        ["orders", "▣", "Order"],
        ["delivery", "🛵", "Delivery"],
        ["chat", "💬", "Chat"]
      ].map(([key, icon, label]) => (
        <button className={active === key ? "active" : ""} key={key} onClick={() => setScreen(key)}>
          <span>{icon}</span><small>{label}</small>
        </button>
      ))}
    </div>
  );
}

/* ---------------- Admin ---------------- */

function Admin({ onExit }) {
  const [screen, setScreen] = useState("home");
  const [selectedUser, setSelectedUser] = useState(adminUsers[0]);

  const openUser = (user) => {
    setSelectedUser(user);
    setScreen("detail");
  };

  return (
    <PhoneFrame title="Admin" onExit={onExit}>
      <div className="admin-screen">
        {screen === "home" && <AdminHome onUsers={() => setScreen("users")} />}
        {screen === "users" && <AdminUsers onBack={() => setScreen("home")} onUser={openUser} />}
        {screen === "detail" && <AdminUserDetail user={selectedUser} onBack={() => setScreen("users")} />}
        {screen === "more" && <AdminMore />}
        {screen === "chat" && <AdminChat />}
        <AdminNav active={screen} setScreen={setScreen} />
      </div>
    </PhoneFrame>
  );
}

function AdminHome({ onUsers }) {
  return (
    <>
      <div className="admin-top">
        <div><div className="mini-avatar">👤</div><div><b>แอดมินครัวหลังมอ</b><small>Admin</small></div></div><span>⌕</span>
      </div>

      <div className="admin-stats">
        <div><b>24</b><small>Order Today</small><em>+XX%</em></div>
        <div><b>1,560</b><small>Revenue Today</small><em>+XX%</em></div>
        <div><b>86</b><small>Total Shop</small><em>+XX%</em></div>
        <div><b>1,254</b><small>Total User</small><em>+XX%</em></div>
      </div>

      <div className="admin-chart-card">
        <b>Sale Revenue</b>
        <div className="line-chart">
          {[20, 34, 27, 41, 35, 55, 48, 67, 59, 78].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}
        </div>
        <small>9/9 &nbsp; 10/9 &nbsp; 11/9 &nbsp; 12/9 &nbsp; 13/9</small>
      </div>

      <button className="admin-card-button" onClick={onUsers}>👤 Manage Users <span>›</span></button>
      <button className="admin-card-button">🔔 Notices <span>›</span></button>
    </>
  );
}

function AdminUsers({ onBack, onUser }) {
  return (
    <>
      <div className="admin-heading">
        <button onClick={onBack}>‹</button>
        <div><b>User / Merchant ผู้ใช้งาน</b><small>จัดการบัญชีผู้ใช้</small></div>
        <button>⋯</button>
      </div>
      <div className="search-pill">⌕ <input placeholder="Search..." /></div>
      <div className="segmented admin-seg"><button className="active">All</button><button>User</button><button>Merchant</button></div>
      {adminUsers.map((user) => (
        <button className="user-row" key={user.name} onClick={() => onUser(user)}>
          <div className="mini-avatar peach">👤</div>
          <div><b>{user.name}</b><small>{user.phone}</small></div>
          <span>{user.role}</span>
          <small>1:52 PM</small>
        </button>
      ))}
    </>
  );
}

function AdminUserDetail({ user, onBack }) {
  return (
    <>
      <div className="detail-header orange"><button onClick={onBack}>‹</button><b>User Detail ประวัติผู้ใช้งาน</b></div>
      <div className="detail-profile">
        <div className="profile-photo">👨</div>
        <div><h2>{user.name}</h2><span className="status-green">● {user.status === "active" ? "active" : "blocked"}</span></div>
      </div>

      <div className="detail-contact">
        <div>☎ Tel. {user.phone}</div>
        <div>✉ mutty@example.com</div>
        <div>📍 หอพักหลังมอ มจพ.</div>
      </div>

      <div className="mini-stats"><div><b>20</b><small>จำนวนออเดอร์</small></div><div><b>XX</b><small>ยอดใช้จ่ายรวม</small></div></div>

      <div className="detail-buttons">
        <button>ระงับบัญชี</button><button>ส่งข้อความ</button>
        <button>เปลี่ยนสิทธิ์</button><button className="danger-filled">บล็อกบัญชี</button>
      </div>
    </>
  );
}

function AdminMore() {
  return (
    <>
      <div className="admin-settings-head">Setting การตั้งค่า</div>
      <div className="setting-profile"><div className="profile-photo">👤</div><div><b>แอดมินครัวหลังมอ</b><small>Admin</small></div></div>
      {["ข้อมูลส่วนตัว", "เปลี่ยนรหัสผ่าน", "การแจ้งเตือน", "ภาษา", "เกี่ยวกับระบบ"].map((x) => <button className="admin-setting-row" key={x}>{x}<span>›</span></button>)}
      <button className="logout-admin">ออกจากระบบ</button>
    </>
  );
}

function AdminChat() {
  return (
    <>
      <div className="admin-chat-header"><button>‹</button><div><b>Support</b><small>ออนไลน์</small></div><span>☎</span></div>
      <div className="chat-messages">
        <div className="chat-bubble left">สวัสดีครับ มีอะไรให้ช่วยเหลือไหมครับ?</div>
        <div className="chat-bubble right">ร้านค้าของผมมีปัญหาเรื่องออเดอร์ครับ</div>
        <div className="chat-bubble left">ส่งเลข Order มาให้ตรวจสอบได้เลยครับ</div>
      </div>
      <div className="chat-input"><input placeholder="เขียนข้อความ..." /><button>➤</button></div>
    </>
  );
}

function AdminNav({ active, setScreen }) {
  return (
    <div className="admin-nav">
      {[
        ["home", "⌂", "Home"],
        ["users", "♙", "User"],
        ["chat", "●", "Notice"],
        ["more", "•••", "More"]
      ].map(([key, icon, label]) => (
        <button className={active === key ? "active" : ""} key={key} onClick={() => setScreen(key)}>
          <span>{icon}</span><small>{label}</small>
        </button>
      ))}
    </div>
  );
}

function PhoneFrame({ children, onExit, title }) {
  return (
    <main className="phone-page">
      <div className="phone-topline">
        <button className="exit-btn" onClick={onExit}>← Roles</button>
        {title && <span>{title}</span>}
      </div>
      <div className="phone-frame">
        <div className="status-pill-top" />
        {children}
      </div>
    </main>
  );
}

function SubHeader({ title, onBack, right }) {
  return (
    <div className="sub-header">
      <button onClick={onBack}>‹</button>
      <b>{title}</b>
      <span>{right || ""}</span>
    </div>
  );
}

function Empty({ text }) {
  return <div className="empty">{text}</div>;
}
