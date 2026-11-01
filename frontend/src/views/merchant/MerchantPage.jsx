"use client";

import { useEffect, useMemo, useState } from "react";
import { BottomNav, MobileShell, SearchBar, StatusPill, TopBar, EmptyState } from "../../components/AppShell";
import { merchantOrdersSeed, statusLabel } from "../../data/mockData";
import { orderApi } from "../../api/orderApi";
import { merchantApi } from "../../api/merchantApi";
import { authApi } from "../../api/authApi";
import { getSocket, playOrderChime } from "../../api/socketClient";
import MerchantLogin from "./MerchantLogin";

export default function MerchantPage() {
  const [screen, setScreen] = useState("home");
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState("all");
  const [deliveryFee, setDeliveryFee] = useState("10");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState("นักศึกษา มจพ.");
  const [chatText, setChatText] = useState("");
  const [statusNotice, setStatusNotice] = useState("");
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [currentMerchant, setCurrentMerchant] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const logged = authApi.isLoggedIn("MERCHANT");
    setIsLoggedIn(logged);
    if (logged) {
      const merchantUser = authApi.getCurrentUser("MERCHANT");
      setCurrentMerchant(merchantUser);
      loadMerchantOrders();
      initSocket(merchantUser);
    }
  }, []);

  function initSocket(merchantUser) {
    const socket = getSocket("MERCHANT");
    if (!socket) return;

    if (merchantUser?.id) {
      socket.emit("join_merchant_room", { merchant_id: merchantUser.id });
    }

    // 1. รับออเดอร์ใหม่แบบ Real-time พร้อมเสียงกระดิ่ง และแบนเนอร์เด้งแจ้งเตือน
    const handleNewOrder = (payload) => {
      console.log("🔔 [Realtime] New order received:", payload);
      playOrderChime();

      const incoming = payload?.order;
      if (incoming) {
        const orderCode = incoming.order_code 
          ? incoming.order_code 
          : `#ORD${String(incoming.id).padStart(3, "0")}`;

        const mapped = {
          id: orderCode.startsWith("#") ? orderCode : `#${orderCode}`,
          rawId: incoming.id,
          customer: incoming.customer_name || "นักศึกษา มจพ.",
          total: parseFloat(incoming.total_amount || 0),
          status: incoming.status || "PENDING_ACCEPT",
          items: Array.isArray(incoming.items) && incoming.items.length > 0 
            ? incoming.items.map(it => typeof it === "string" ? it : `${it.name || "อาหาร"} x${it.quantity || 1}`)
            : ["รายการอาหารสดใหม่"],
          time: incoming.created_at 
            ? new Date(incoming.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : "เมื่อสักครู่"
        };

        setOrders((current) => [mapped, ...current.filter((o) => o.rawId !== incoming.id)]);

        setNewOrderAlert({
          id: mapped.id,
          rawId: mapped.rawId,
          customer: mapped.customer,
          dorm: incoming.dormitory_name || incoming.delivery_room_number || "จัดส่งถึงหอพัก",
          total: mapped.total
        });

        loadMerchantOrders();
      }
    };

    // 2. รับการอัปเดตสถานะออเดอร์แบบ Real-time
    const handleStatusUpdate = (payload) => {
      console.log("⚡ [Realtime] Order status updated:", payload);
      const { order_id, status } = payload;
      if (!order_id || !status) return;

      setOrders((current) => current.map((o) => {
        const isMatch = o.rawId === Number(order_id) || o.id === `#ORD${String(order_id).padStart(3, "0")}`;
        return isMatch ? { ...o, status } : o;
      }));

      setStatusNotice(`⚡ ออเดอร์ #${order_id} อัปเดตสถานะ: ${statusLabel[status] || status}`);
      playOrderChime();
      setTimeout(() => setStatusNotice(""), 3500);
    };

    socket.on("NEW_ORDER_RECEIVED", handleNewOrder);
    socket.on("ORDER_STATUS_UPDATED", handleStatusUpdate);

    return () => {
      socket.off("NEW_ORDER_RECEIVED", handleNewOrder);
      socket.off("ORDER_STATUS_UPDATED", handleStatusUpdate);
    };
  }

  function handleLogout() {
    authApi.logout("MERCHANT");
    setIsLoggedIn(false);
    setCurrentMerchant(null);
    setOrders([]);
  }

  async function loadMerchantOrders() {
    if (!authApi.isLoggedIn("MERCHANT")) return;
    try {
      const serverOrders = await orderApi.getMerchantOrders();
      if (Array.isArray(serverOrders)) {
        const mapped = serverOrders.map(o => {
          let itemsList = [];
          if (Array.isArray(o.items) && o.items.length > 0) {
            itemsList = o.items.map(it => {
              if (typeof it === "string") return it;
              const choiceStr = it.choices && it.choices.length > 0 ? ` (${it.choices.join(", ")})` : "";
              const noteStr = it.note ? ` [หมายเหตุ: ${it.note}]` : "";
              return `${it.name || "อาหาร"}${choiceStr} x${it.quantity || 1}${noteStr}`;
            });
          } else if (Array.isArray(o.items_summary) && o.items_summary.length > 0) {
            itemsList = o.items_summary;
          } else {
            itemsList = ["รายการอาหาร"];
          }

          const orderCode = o.order_code 
            ? (o.order_code.startsWith("#") ? o.order_code : `#${o.order_code}`) 
            : `#ORD${String(o.id).padStart(3, "0")}`;

          return {
            id: orderCode,
            rawId: o.id,
            customer: o.customer_name || "นักศึกษา มจพ.",
            customerPhone: o.customer_phone || "",
            dormitory: o.dormitory_name || "",
            roomNumber: o.delivery_room_number || "",
            total: parseFloat(o.total_amount || 0),
            deliveryFee: parseFloat(o.delivery_fee || 0),
            status: o.status,
            items: itemsList,
            time: o.created_at ? new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "เมื่อสักครู่"
          };
        });
        setOrders(mapped);
      }
    } catch (err) {
      console.log("Could not load backend merchant orders:", err.message);
    }
  }

  const filteredOrders = useMemo(() => orders.filter((o) => {
    const q = `${o.id} ${o.customer}`.toLowerCase();
    if (!q.includes(query.toLowerCase())) return false;
    if (orderFilter === "pending") return ["PENDING_ACCEPT", "PENDING_PAYMENT", "PAID"].includes(o.status);
    if (orderFilter === "preparing") return o.status === "PREPARING";
    if (orderFilter === "done") return ["READY_FOR_DELIVERY", "COMPLETED"].includes(o.status);
    return true;
  }), [orders, orderFilter, query]);

  async function updateOrder(id, status) {
    const target = orders.find(o => o.id === id);
    const rawId = target?.rawId || id.replace("#ORD", "").replace(/^[A-Z]+-/, "");

    try {
      if (status === "PREPARING") {
        await orderApi.startPreparing(rawId).catch(() => orderApi.acceptOrder(rawId));
        setStatusNotice(`⚡ อัปเดตออเดอร์ ${id} กำลังทำอาหาร`);
      } else if (status === "READY_FOR_DELIVERY") {
        await orderApi.markReadyForDelivery(rawId).catch(() => orderApi.completeEntireOrder(rawId));
        setStatusNotice(`🛵 อัปเดตออเดอร์ ${id} พร้อมจัดส่งแล้ว`);
      } else if (status === "REJECTED_BY_MERCHANT") {
        await orderApi.rejectOrder(rawId, "ร้านค้าปฏิเสธออเดอร์");
        setStatusNotice(`✕ ปฏิเสธออเดอร์ ${id} เรียบร้อยแล้ว`);
      }
      await loadMerchantOrders();
    } catch (err) {
      console.log("Order status update API notice:", err.message);
      setStatusNotice(`⚡ บันทึกสถานะ: ${statusLabel[status] || status}`);
      setOrders((current) => current.map((o) => o.id === id ? { ...o, status } : o));
    }

    setTimeout(() => setStatusNotice(""), 3000);
  }

  const sendChat = (e) => { 
    e.preventDefault(); 
    if (!chatText.trim()) return; 
    setMessages((m) => [...m, { user: selectedChat, from: "merchant", text: chatText }]); 
    setChatText(""); 
  };

  if (!isLoggedIn) {
    return (
      <MobileShell tone="merchant">
        <MerchantLogin
          onSuccess={(merchantData) => {
            setCurrentMerchant(merchantData);
            setIsLoggedIn(true);
            loadMerchantOrders();
            initSocket(merchantData);
          }}
          onBack={() => {
            window.location.href = "/";
          }}
        />
      </MobileShell>
    );
  }

  return (
    <MobileShell tone="merchant">
      <div key={screen} className="merchant-page screen-enter">
        {/* ป๊อปอัปแจ้งเตือนออเดอร์ใหม่แบบ Real-time พร้อมปุ่มกดดูทันที */}
        {newOrderAlert && (
          <div style={{
            background: "linear-gradient(135deg, #ff7a18 0%, #ff5200 100%)",
            color: "white",
            padding: "12px 16px",
            borderRadius: "14px",
            margin: "10px 12px",
            boxShadow: "0 8px 24px rgba(255, 82, 0, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            animation: "pulseAlert 0.4s ease-out",
            border: "1.5px solid rgba(255, 255, 255, 0.4)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>🔔</span>
              <div>
                <b style={{ fontSize: "14px", display: "block" }}>มีออเดอร์ใหม่เข้ามา! {newOrderAlert.id}</b>
                <small style={{ fontSize: "12px", opacity: 0.95 }}>
                  {newOrderAlert.customer} · {newOrderAlert.dorm} · <b>฿{newOrderAlert.total}</b>
                </small>
              </div>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => {
                  setNewOrderAlert(null);
                  setScreen("orders");
                  setOrderFilter("all");
                }}
                style={{
                  background: "white",
                  color: "#ff5200",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                ดูออเดอร์
              </button>
              <button
                onClick={() => setNewOrderAlert(null)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {statusNotice && (
          <div style={{ 
            background: "#2f855a", 
            color: "white", 
            padding: "8px 14px", 
            borderRadius: "8px", 
            margin: "8px 12px", 
            fontSize: "13px", 
            textAlign: "center",
            boxShadow: "0 4px 12px rgba(47, 133, 90, 0.25)"
          }}>
            {statusNotice}
          </div>
        )}

        {/* แบนเนอร์แจ้งเตือนสถานะการอนุมัติร้านค้า */}
        {currentMerchant && !currentMerchant.is_approved && (
          <div style={{
            background: "#fffbeb",
            border: "1.5px solid #fde68a",
            color: "#92400e",
            padding: "12px 16px",
            borderRadius: "14px",
            margin: "10px 12px",
            fontSize: "13px",
            lineHeight: 1.5,
            boxShadow: "0 2px 8px rgba(245, 158, 11, 0.1)"
          }}>
            <b style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>
              ⏳ ร้านค้าของคุณอยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบ (Pending Approval)
            </b>
            คุณสามารถเพิ่มเมนูอาหารและตั้งค่าข้อมูลร้านค้าล่วงหน้าได้ แต่ยังไม่สามารถเปิดรับออเดอร์จากลูกค้าได้จนกว่าแอดมินจะอนุมัติ
          </div>
        )}

        {screen === "home" && (
          <MerchantHome 
            orders={orders} 
            go={setScreen} 
            query={query} 
            setQuery={setQuery} 
            merchant={currentMerchant}
            onLogout={handleLogout}
          />
        )}
        {screen === "menus" && (
          <MerchantMenus
            merchant={currentMerchant}
            onBack={() => setScreen("home")}
          />
        )}
        {screen === "orders" && (
          <MerchantOrders 
            orders={filteredOrders} 
            filter={orderFilter} 
            setFilter={setOrderFilter} 
            query={query} 
            setQuery={setQuery} 
            onBack={() => setScreen("home")} 
            updateOrder={updateOrder} 
          />
        )}
        {screen === "delivery" && (
          <MerchantDelivery 
            orders={orders} 
            deliveryFee={deliveryFee} 
            setDeliveryFee={setDeliveryFee} 
            onBack={() => setScreen("home")} 
          />
        )}
        {screen === "chat" && (
          <MerchantChat 
            selected={selectedChat} 
            setSelected={setSelectedChat} 
            messages={messages} 
            value={chatText} 
            setValue={setChatText} 
            onSend={sendChat} 
            onBack={() => setScreen("home")} 
          />
        )}
      </div>
      <BottomNav 
        tone="merchant" 
        active={screen} 
        onChange={(key) => setScreen(key)} 
        items={[
          { key: "home", label: "หน้าหลัก", icon: "⌂" },
          { key: "orders", label: `ออเดอร์ (${orders.filter(o => ["PENDING_ACCEPT", "PENDING_PAYMENT", "PAID"].includes(o.status)).length})`, icon: "▣" },
          { key: "menus", label: "เมนูอาหาร", icon: "🍲" },
          { key: "delivery", label: "จัดส่ง", icon: "🛵" },
          { key: "chat", label: "แชท", icon: "💬" }
        ]} 
      />
    </MobileShell>
  );
}

function MerchantHome({ orders, go, query, setQuery, merchant, onLogout }) {
  const storeTitle = merchant?.store_name || "ร้านอาหารหลัง มจพ.";
  const locationDesc = merchant?.location || "หลังมอ ซอย 11 · เปิดรับออเดอร์ (Real-time เชื่อมต่อแล้ว)";

  const todayCount = orders.length;
  const todayRevenue = orders
    .filter(o => ["PAID", "PREPARING", "READY_FOR_DELIVERY", "COMPLETED"].includes(o.status))
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  return (
    <>
      <div className="merchant-profile">
        <div className="avatar peach">🏪</div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <b>{storeTitle}</b>
            {merchant?.is_approved ? (
              <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "6px", fontSize: "10.5px", fontWeight: 700 }}>อนุมัติแล้ว</span>
            ) : (
              <span style={{ background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: "6px", fontSize: "10.5px", fontWeight: 700 }}>รอแอดมินอนุมัติ</span>
            )}
          </div>
          <small>{locationDesc}</small>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => go("orders")} title="รีเฟรชออเดอร์">⚡ Real-time</button>
          <button onClick={onLogout} style={{ background: "#fff1f2", color: "#e11d48", border: "1px solid #fecdd3" }} title="ออกจากระบบร้านค้า">🚪 ออก</button>
        </div>
      </div>

      <SearchBar value={query} onChange={setQuery} placeholder="ค้นหาเลขออเดอร์ หรือชื่อลูกค้า..." />
      
      <div className="merchant-quick">
        <button onClick={() => go("menus")} style={{ background: "#ecfdf5", color: "#065f46", borderColor: "#a7f3d0" }}>🍲 จัดการเมนู (＋เพิ่ม)</button>
        <button onClick={() => go("orders")}>ทั้งหมด ({orders.length})</button>
        <button onClick={() => go("orders")}>รอรับ <span>{orders.filter(o => ["PENDING_ACCEPT", "PAID"].includes(o.status)).length}</span></button>
        <button onClick={() => go("orders")}>กำลังทำ <span>{orders.filter(o => o.status === "PREPARING").length}</span></button>
      </div>

      <div className="merchant-stats">
        <div>
          <b>{todayCount}</b>
          <small>Order ทั้งหมด</small>
          <em>Real-time</em>
        </div>
        <div>
          <b>฿{todayRevenue.toLocaleString()}</b>
          <small>ยอดขายวันนี้</small>
          <em>+100%</em>
        </div>
      </div>

      <div className="section-header">
        <b>ออเดอร์ล่าสุด (อัปเดตอัตโนมัติ)</b>
        <button onClick={() => go("orders")}>ดูทั้งหมด ({orders.length}) ›</button>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 16px", color: "#64748b", background: "white", borderRadius: "14px", margin: "10px 0" }}>
          <div style={{ fontSize: "36px", marginBottom: "8px" }}>📦</div>
          <b style={{ color: "#334155", display: "block" }}>ยังไม่มีออเดอร์ในขณะนี้</b>
          <small>ระบบจะส่งเสียงกระดิ่งเตือนและอัปเดตอัตโนมัติทันทีเมื่อมีลูกค้าสั่งอาหาร</small>
        </div>
      ) : (
        orders.slice(0, 5).map((o) => (
          <button className="merchant-recent" key={o.id} onClick={() => go("orders")}>
            <div className="food-thumb">🍛</div>
            <div>
              <b>{o.customer}</b>
              <small>{o.id} · {statusLabel[o.status] || o.status} {o.roomNumber ? `· ${o.roomNumber}` : ""}</small>
            </div>
            <strong>฿{o.total}</strong>
          </button>
        ))
      )}
    </>
  );
}

function MerchantOrders({ orders, filter, setFilter, query, setQuery, onBack, updateOrder }) {
  return (
    <>
      <TopBar title="จัดการออเดอร์" subtitle="Real-time Order Management" onBack={onBack} />
      <SearchBar value={query} onChange={setQuery} placeholder="ค้นหาเลขออเดอร์ หรือลูกค้า..." />
      <div className="filter-scroll merchant-filters">
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
          ทั้งหมด ({orders.length})
        </button>
        <button className={filter === "pending" ? "active" : ""} onClick={() => setFilter("pending")}>
          รอรับ/รอชำระ
        </button>
        <button className={filter === "preparing" ? "active" : ""} onClick={() => setFilter("preparing")}>
          กำลังทำ
        </button>
        <button className={filter === "done" ? "active" : ""} onClick={() => setFilter("done")}>
          เสร็จแล้ว/พร้อมส่ง
        </button>
      </div>

      {orders.length ? (
        orders.map((o) => (
          <div className="merchant-order-card" key={o.id}>
            <div className="order-head">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <b>{o.customer}</b>
                  {o.customerPhone && <span style={{ fontSize: "11px", color: "#64748b" }}>📞 {o.customerPhone}</span>}
                </div>
                <small>Order ID: {o.id} · {o.time}</small>
                {o.roomNumber && (
                  <div style={{ fontSize: "12px", color: "#0284c7", marginTop: "2px", fontWeight: 500 }}>
                    📍 {o.roomNumber}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <strong>฿{o.total}</strong>
                {o.deliveryFee > 0 && <small style={{ fontSize: "10.5px", color: "#64748b", display: "block" }}>(ค่าส่ง ฿{o.deliveryFee})</small>}
              </div>
            </div>
            <div className="order-items">
              {o.items?.map((x, i) => (
                <span key={i}>• {x}</span>
              ))}
            </div>
            <div className="order-footer">
              <StatusPill tone={["PENDING_ACCEPT", "PENDING_PAYMENT", "PAID"].includes(o.status) ? "orange" : o.status === "PREPARING" ? "yellow" : ["READY_FOR_DELIVERY", "IN_DELIVERY", "COMPLETED"].includes(o.status) ? "green" : "red"}>
                {statusLabel[o.status] || o.status}
              </StatusPill>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {o.status === "PENDING_ACCEPT" && (
                  <>
                    <button className="accept-button" onClick={() => updateOrder(o.id, "PREPARING")}>
                      ✓ รับ & เริ่มทำ
                    </button>
                    <button 
                      onClick={() => updateOrder(o.id, "REJECTED_BY_MERCHANT")}
                      style={{
                        background: "#fee2e2",
                        color: "#b91c1c",
                        border: "1px solid #fca5a5",
                        borderRadius: "8px",
                        padding: "6px 10px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      ✕ ปฏิเสธ
                    </button>
                  </>
                )}
                {["PAID", "PENDING_PAYMENT"].includes(o.status) && (
                  <button className="accept-button" onClick={() => updateOrder(o.id, "PREPARING")}>
                    🍳 เริ่มทำอาหาร
                  </button>
                )}
                {o.status === "PREPARING" && (
                  <button className="accept-button" onClick={() => updateOrder(o.id, "READY_FOR_DELIVERY")}>
                    🛵 พร้อมจัดส่ง
                  </button>
                )}
                {o.status === "READY_FOR_DELIVERY" && (
                  <span style={{ fontSize: "12px", color: "#059669", fontWeight: 600 }}>🛵 รอไรเดอร์มารับ</span>
                )}
                {o.status === "IN_DELIVERY" && (
                  <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: 600 }}>🚴‍♂️ กำลังนำส่ง</span>
                )}
                {o.status === "COMPLETED" && (
                  <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>✅ ส่งสำเร็จแล้ว</span>
                )}
                {["REJECTED_BY_MERCHANT", "CANCELLED_BY_CUSTOMER", "CANCELLED_BY_TIMEOUT"].includes(o.status) && (
                  <span style={{ fontSize: "12px", color: "#dc2626", fontWeight: 600 }}>✕ ยกเลิกแล้ว</span>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <EmptyState title="ไม่มีรายการออเดอร์" text="ยังไม่มีออเดอร์ตามตัวกรองที่เลือกในขณะนี้" />
      )}
    </>
  );
}

function MerchantDelivery({ orders, deliveryFee, setDeliveryFee, onBack }) {
  const ready = orders.filter((o) => ["READY_FOR_DELIVERY", "IN_DELIVERY", "COMPLETED"].includes(o.status));
  return (
    <>
      <TopBar title="การจัดส่ง" subtitle="Delivery Management" onBack={onBack} />
      <div className="delivery-fee-box">
        <h3>กำหนดค่าจัดส่งเริ่มต้น (บาท)</h3>
        <input 
          value={deliveryFee} 
          onChange={(e) => setDeliveryFee(e.target.value.replace(/\D/g, ""))} 
        />
        <div className="range-track"><i /></div>
        <button className="primary-btn">บันทึกค่าจัดส่ง</button>
      </div>
      <div className="section-header">
        <b>ออเดอร์ที่พร้อมจัดส่ง/กำลังส่ง</b>
        <span>{ready.length} รายการ</span>
      </div>
      {ready.map((o) => (
        <div className="merchant-order-card compact" key={o.id}>
          <div className="order-head">
            <div>
              <b>{o.id}</b>
              <small>{o.customer}</small>
            </div>
            <StatusPill tone="green">{statusLabel[o.status] || o.status}</StatusPill>
          </div>
          <strong>฿{o.total}</strong>
        </div>
      ))}
    </>
  );
}

function MerchantChat({ selected, setSelected, messages, value, setValue, onSend, onBack }) {
  const contacts = ["นักศึกษา มจพ.", "Petchtae", "Thanakrit", "Napat", "บ้านหลังมอ", "Chonlatit"];
  return (
    <>
      <TopBar title="แชทติดต่อลูกค้า" subtitle="Direct Customer Chat" onBack={onBack} />
      <div className="merchant-chat-layout">
        <div className="contact-list">
          {contacts.map((c) => (
            <button className={selected === c ? "selected" : ""} key={c} onClick={() => setSelected(c)}>
              <div className="avatar small">👤</div>
              <div>
                <b>{c}</b>
                <small>{c === selected ? "ข้อความล่าสุด..." : "Order message..."}</small>
              </div>
              <span>เมื่อสักครู่</span>
            </button>
          ))}
        </div>
        <div className="chat-panel">
          <div className="chat-panel-top">
            <div className="avatar small">👤</div>
            <div>
              <b>{selected}</b>
              <small>online (เชื่อมต่อพร้อมแชท)</small>
            </div>
          </div>
          <div className="chat-messages short">
            {messages.filter((m) => m.user === selected).map((m, i) => (
              <div className="chat-bubble me" key={i}>{m.text}</div>
            ))}
            <div className="chat-bubble store">สวัสดีครับ ร้านได้รับออเดอร์เรียบร้อยแล้ว กำลังจัดเตรียมให้นะครับ</div>
          </div>
          <form className="chat-compose" onSubmit={onSend}>
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="พิมพ์ข้อความตอบกลับ..." />
            <button type="submit">➤</button>
          </form>
        </div>
      </div>
    </>
  );
}

function MerchantMenus({ merchant, onBack }) {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    loadMenus();
  }, [merchant?.id]);

  async function loadMenus() {
    setLoading(true);
    try {
      if (merchant?.id) {
        const data = await merchantApi.getMerchantMenu(merchant.id);
        if (Array.isArray(data)) setMenus(data);
      }
    } catch (err) {
      console.warn("Could not load merchant menus:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateMenu(e) {
    e.preventDefault();
    if (!name.trim() || !price) return;
    setSubmitting(true);
    try {
      await merchantApi.createMenu({
        name: name.trim(),
        price: parseFloat(price),
        description: description.trim() || undefined,
        is_available: true
      });
      setNotice("✅ เพิ่มเมนูอาหารสำเร็จ!");
      setName("");
      setPrice("");
      setDescription("");
      setShowAddModal(false);
      loadMenus();
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      alert("ไม่สามารถเพิ่มเมนูได้: " + (err?.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(menuId, currentAvail) {
    try {
      await merchantApi.toggleMenuAvailability(menuId, !currentAvail);
      setMenus(current => current.map(m => m.id === menuId ? { ...m, is_available: !currentAvail } : m));
    } catch (err) {
      console.warn("Toggle error:", err);
    }
  }

  async function handleDelete(menuId) {
    if (!confirm("คุณแน่ใจว่าต้องการลบเมนูนี้ใช่หรือไม่?")) return;
    try {
      await merchantApi.deleteMenu(menuId);
      setMenus(current => current.filter(m => m.id !== menuId));
    } catch (err) {
      console.warn("Delete error:", err);
    }
  }

  return (
    <div style={{ paddingBottom: "30px" }}>
      <TopBar title="จัดการเมนูอาหาร" subtitle={`${merchant?.store_name || "ร้านอาหาร"} (${menus.length} รายการ)`} onBack={onBack} />
      
      {notice && (
        <div style={{ background: "#2f855a", color: "white", padding: "10px 14px", borderRadius: "10px", margin: "10px 12px", textAlign: "center", fontSize: "13px" }}>
          {notice}
        </div>
      )}

      <div style={{ padding: "0 12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <b style={{ fontSize: "16px", color: "#1e293b" }}>รายการอาหารของร้าน</b>
          <small style={{ display: "block", color: "#64748b" }}>จัดการราคาและเปิด-ปิดการขาย</small>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "white",
            border: "none",
            borderRadius: "10px",
            padding: "8px 14px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)"
          }}
        >
          ＋ เพิ่มเมนูใหม่
        </button>
      </div>

      {/* Modal เพิ่มเมนูใหม่ */}
      {showAddModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          padding: "16px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "20px",
            padding: "24px",
            width: "100%",
            maxWidth: "420px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <b style={{ fontSize: "18px", color: "#1e293b" }}>🍲 เพิ่มเมนูอาหารใหม่</b>
              <button onClick={() => setShowAddModal(false)} style={{ border: "none", background: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            <form onSubmit={handleCreateMenu} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="auth-field-group">
                <label>ชื่อเมนูอาหาร *</label>
                <input
                  type="text"
                  placeholder="เช่น ข้าวกะเพราหมูกรอบไข่ดาว"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field-group">
                <label>ราคา (บาท) *</label>
                <input
                  type="number"
                  placeholder="เช่น 60"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  min="0"
                  step="1"
                />
              </div>

              <div className="auth-field-group">
                <label>รายละเอียด / ส่วนผสม</label>
                <textarea
                  placeholder="เช่น รสจัดจ้าน เสิร์ฟพร้อมน้ำซุป"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#475569",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 2,
                    padding: "12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)"
                  }}
                >
                  {submitting ? "กำลังบันทึก..." : "บันทึกเมนู"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* รายการเมนู */}
      <div style={{ padding: "0 12px" }}>
        {menus.length > 0 ? (
          menus.map((item) => (
            <div
              key={item.id}
              style={{
                background: "white",
                borderRadius: "14px",
                padding: "14px 16px",
                marginBottom: "10px",
                border: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
              }}
            >
              <div>
                <b style={{ fontSize: "15px", color: "#1e293b", display: "block" }}>{item.name}</b>
                <small style={{ color: "#64748b", display: "block", marginBottom: "4px" }}>{item.description || "ปรุงสดใหม่ตามสั่ง"}</small>
                <strong style={{ color: "#10b981", fontSize: "15px" }}>฿{item.price}</strong>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={() => handleToggle(item.id, item.is_available)}
                  style={{
                    background: item.is_available ? "#ecfdf5" : "#fef2f2",
                    color: item.is_available ? "#059669" : "#dc2626",
                    border: item.is_available ? "1px solid #a7f3d0" : "1px solid #fecaca",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {item.is_available ? "เปิดขาย" : "หมดชั่วคราว"}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: "16px",
                    padding: "4px 8px"
                  }}
                  title="ลบเมนู"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            title="ยังไม่มีเมนูอาหาร"
            text="กดปุ่ม '＋ เพิ่มเมนูใหม่' ด้านบน เพื่อเริ่มต้นสร้างเมนูของร้านคุณ"
          />
        )}
      </div>
    </div>
  );
}
