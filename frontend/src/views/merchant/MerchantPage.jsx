"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BottomNav, MobileShell, SearchBar, StatusPill, TopBar, EmptyState } from "../../components/AppShell";
import { merchantOrdersSeed, statusLabel } from "../../data/mockData";
import { orderApi } from "../../api/orderApi";
import { merchantApi } from "../../api/merchantApi";
import { authApi } from "../../api/authApi";
import { getSocket, playOrderChime } from "../../api/socketClient";
import MerchantLogin from "./MerchantLogin";
import MerchantKDS from "./MerchantKDS";

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
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadByOrder, setUnreadByOrder] = useState({});
  const [selectedChatOrder, setSelectedChatOrder] = useState(null);
  const prevOrderIds = useRef(new Set());

  async function loadUnreadCounts() {
    if (!authApi.isLoggedIn("MERCHANT")) return;
    try {
      const res = await orderApi.getUnreadCount("MERCHANT");
      if (res?.byOrder) {
        setUnreadByOrder(res.byOrder);
      }
      if (typeof res?.totalUnread === "number") {
        setUnreadChatCount(res.totalUnread);
      }
    } catch (e) {}
  }

  useEffect(() => {
    const logged = authApi.isLoggedIn("MERCHANT");
    setIsLoggedIn(logged);
    if (logged) {
      const merchantUser = authApi.getCurrentUser("MERCHANT");
      setCurrentMerchant(merchantUser);
      merchantApi.getStoreProfile().then(prof => {
        if (prof) {
          const merged = { ...merchantUser, ...prof };
          setCurrentMerchant(merged);
          try {
            localStorage.setItem("merchant_user", JSON.stringify(merged));
          } catch (e) {}
        }
      }).catch(() => null);
      loadMerchantOrders();
      loadUnreadCounts();
      initSocket(merchantUser);
    }
  }, []);

  // Polling fallback ทุกๆ 4 วินาที สำหรับร้านค้า เพื่อให้ออเดอร์และแชทอัปเดตสดเสมอแม้ Socket ขัดข้อง
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      loadMerchantOrders();
      loadUnreadCounts();
    }, 4000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  function initSocket(merchantUser) {
    const socket = getSocket("MERCHANT");
    if (!socket) return;

    const rejoinRooms = () => {
      if (merchantUser?.id) {
        socket.emit("join_merchant_room", { merchant_id: merchantUser.id });
        socket.emit("join_kds_room", { merchant_id: merchantUser.id });
      }
    };

    rejoinRooms();
    socket.on("connect", rejoinRooms);

    // 1. รับออเดอร์ใหม่แบบ Real-time พร้อมเสียงกระดิ่ง และแบนเนอร์เด้งแจ้งเตือน
    const handleNewOrder = (payload) => {
      console.log("🔔 [Realtime] New order received:", payload);
      // ตรวจสอบว่าเป็นออเดอร์ของร้านตนเอง
      if (payload.merchant_id && Number(payload.merchant_id) !== Number(merchantUser?.id)) {
        return;
      }
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
        const isMatch = Number(o.rawId) === Number(order_id) || 
                        o.id === `#ORD${String(order_id).padStart(3, "0")}` ||
                        (payload.order_code && o.id.includes(payload.order_code.replace(/^#/, "")));
        return isMatch ? { ...o, status } : o;
      }));

      loadMerchantOrders();

      const displayCode = payload.order_code ? (payload.order_code.startsWith("#") ? payload.order_code : `#${payload.order_code}`) : `#${order_id}`;
      setStatusNotice(`⚡ ออเดอร์ ${displayCode} อัปเดตสถานะ: ${statusLabel[status] || status}`);
      playOrderChime();
      setTimeout(() => setStatusNotice(""), 3500);
    };

    // 3. รับข้อความแชทใหม่แบบ Real-time
    const handleNewChat = (payload) => {
      console.log("💬 [Merchant Socket] NEW_CHAT_MESSAGE:", payload);
      // หากร้านค้าเป็นผู้ส่งเอง ไม่ต้องแจ้งเตือน
      if (payload.is_merchant_sender && (payload.sender_sub_role === 'STORE' || payload.role === 'STORE')) {
        return;
      }
      playOrderChime();
      const ordId = Number(payload.order_id || payload.orderId);
      if (ordId) {
        setUnreadByOrder(prev => ({ ...prev, [ordId]: (prev[ordId] || 0) + 1 }));
      }
      setUnreadChatCount(c => c + 1);

      const senderTitle = payload.sender_sub_role === "RIDER" ? "ไรเดอร์" : "ลูกค้า";
      const messagePreview = payload.content_text || payload.contentText || "";
      setStatusNotice(`💬 มีข้อความใหม่จาก${senderTitle}: ${messagePreview}`);
      setTimeout(() => setStatusNotice(""), 4500);
    };

    socket.on("NEW_ORDER_RECEIVED", handleNewOrder);
    socket.on("ORDER_STATUS_UPDATED", handleStatusUpdate);
    socket.on("NEW_CHAT_MESSAGE", handleNewChat);

    return () => {
      socket.off("connect", rejoinRooms);
      socket.off("NEW_ORDER_RECEIVED", handleNewOrder);
      socket.off("ORDER_STATUS_UPDATED", handleStatusUpdate);
      socket.off("NEW_CHAT_MESSAGE", handleNewChat);
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
        // ตรวจสอบว่ามีออเดอร์ PENDING_ACCEPT ใหม่เข้ามาหรือไม่เพื่อเล่นเสียงแจ้งเตือน
        const currentPending = mapped.filter(o => o.status === "PENDING_ACCEPT");
        if (prevOrderIds.current.size > 0) {
          const freshOrders = currentPending.filter(o => !prevOrderIds.current.has(o.rawId));
          if (freshOrders.length > 0) {
            playOrderChime();
            const newest = freshOrders[0];
            setNewOrderAlert({
              id: newest.id,
              rawId: newest.rawId,
              customer: newest.customer,
              dorm: newest.roomNumber || "จัดส่งถึงหอพัก",
              total: newest.total
            });
          }
        }
        prevOrderIds.current = new Set(mapped.map(o => o.rawId));
        setOrders(mapped);
      }
    } catch (err) {
      console.log("Could not load backend merchant orders:", err.message);
    }
  }

  const filteredOrders = useMemo(() => orders
    .filter((o) => {
      const q = `${o.id} ${o.customer}`.toLowerCase();
      if (!q.includes(query.toLowerCase())) return false;
      if (orderFilter === "pending") return ["PENDING_ACCEPT", "PENDING_PAYMENT"].includes(o.status);
      if (orderFilter === "preparing") return o.status === "PREPARING";
      if (orderFilter === "ready") return o.status === "READY_FOR_DELIVERY";
      if (orderFilter === "completed") return ["IN_DELIVERY", "COMPLETED"].includes(o.status);
      return true;
    })
    .sort((a, b) => Number(a.rawId || 0) - Number(b.rawId || 0)), // มาก่อนอยู่บน (FIFO)
  [orders, orderFilter, query]);

  async function updateOrder(id, status) {
    const target = orders.find(o => o.id === id);
    const rawId = target?.rawId || id.replace("#ORD", "").replace(/^[A-Z]+-/, "");

    try {
      if (status === "PENDING_PAYMENT") {
        await orderApi.acceptOrder(rawId);
        setStatusNotice(`✅ รับออเดอร์ ${id} สำเร็จแล้ว (รอลูกค้าชำระเงิน)`);
      } else if (status === "PREPARING") {
        await orderApi.startPreparing(rawId).catch(() => orderApi.acceptOrder(rawId));
        setStatusNotice(`⚡ อัปเดตออเดอร์ ${id} กำลังทำอาหาร`);
      } else if (status === "READY_FOR_DELIVERY") {
        await orderApi.markReadyForDelivery(rawId).catch(() => orderApi.completeEntireOrder(rawId));
        setStatusNotice(`🛵 อัปเดตออเดอร์ ${id} พร้อมจัดส่งแล้ว`);
      } else if (status === "COMPLETED") {
        await orderApi.completeOrder(rawId);
        setStatusNotice(`✅ ออเดอร์ ${id} ลูกค้ามารับเรียบร้อยแล้ว (เสร็จสิ้น)`);
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
            onUpdateMerchant={(updated) => {
              const merged = { ...currentMerchant, ...updated };
              setCurrentMerchant(merged);
              try {
                localStorage.setItem("merchant_user", JSON.stringify(merged));
              } catch (e) {}
              setStatusNotice("✅ บันทึกข้อมูลร้านค้าและพร้อมเพย์เรียบร้อยแล้ว!");
              setTimeout(() => setStatusNotice(""), 4000);
            }}
            onLogout={handleLogout}
          />
        )}
        {screen === "kds" && (
          <MerchantKDS onBack={() => setScreen("orders")} />
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
            allOrders={orders}
            filter={orderFilter} 
            setFilter={setOrderFilter} 
            query={query} 
            setQuery={setQuery} 
            onBack={() => setScreen("home")} 
            updateOrder={updateOrder} 
            unreadByOrder={unreadByOrder}
            onOpenChat={(ord) => {
              setSelectedChatOrder(ord);
              if (ord?.rawId) {
                setUnreadByOrder(prev => ({ ...prev, [ord.rawId]: 0 }));
              }
              setScreen("chat");
            }}
          />
        )}
        {screen === "delivery" && (
          <MerchantDelivery 
            orders={orders} 
            deliveryFee={deliveryFee} 
            setDeliveryFee={setDeliveryFee} 
            loadMerchantOrders={loadMerchantOrders}
            onBack={() => setScreen("home")} 
            onOpenChat={(ord) => {
              setSelectedChatOrder(ord);
              setScreen("chat");
            }}
          />
        )}
        {screen === "chat" && (
          <MerchantChat 
            orders={orders}
            initialOrder={selectedChatOrder}
            onBack={() => setScreen("orders")} 
            onUnreadChange={setUnreadChatCount}
          />
        )}
      </div>
      {!["chat"].includes(screen) && (
        <BottomNav 
          tone="merchant" 
          active={screen} 
          onChange={(key) => setScreen(key)} 
          items={[
            { key: "home", label: "หน้าหลัก", icon: "⌂" },
            { key: "orders", label: `ออเดอร์ (${orders.filter(o => ["PENDING_ACCEPT", "PENDING_PAYMENT"].includes(o.status)).length})`, icon: "▣" },
            { key: "kds", label: `จอครัว (${orders.filter(o => o.status === "PREPARING").length})`, icon: "🍳" },
            { key: "menus", label: "เมนู", icon: "🍲" },
            { key: "delivery", label: orders.filter(o => o.status === "READY_FOR_DELIVERY" && !o.roomNumber?.includes("รับเอง")).length > 0 ? `จัดส่ง (${orders.filter(o => o.status === "READY_FOR_DELIVERY" && !o.roomNumber?.includes("รับเอง")).length})` : "จัดส่ง", icon: "🛵" },
            { key: "chat", label: unreadChatCount > 0 ? `แชท (${unreadChatCount})` : "แชท", icon: "💬" }
          ]} 
        />
      )}
    </MobileShell>
  );
}

function MerchantHome({ orders, go, query, setQuery, merchant, onUpdateMerchant, onLogout }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStoreName, setEditStoreName] = useState(merchant?.store_name || "");
  const [editPromptPay, setEditPromptPay] = useState(merchant?.promptpay_id || "");
  const [editLocation, setEditLocation] = useState(merchant?.location || "");
  const [editIsOpen, setEditIsOpen] = useState(merchant?.is_open !== false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (merchant) {
      setEditStoreName(merchant.store_name || "");
      setEditPromptPay(merchant.promptpay_id || "");
      setEditLocation(merchant.location || "");
      setEditIsOpen(merchant.is_open !== false);
    }
  }, [merchant]);

  async function handleSaveStoreProfile(e) {
    e.preventDefault();
    if (!editStoreName.trim()) {
      alert("กรุณาระบุชื่อร้านค้า");
      return;
    }
    setSavingProfile(true);
    try {
      const updated = await merchantApi.updateStoreProfile({
        store_name: editStoreName.trim(),
        promptpay_id: editPromptPay.trim(),
        location: editLocation.trim(),
        is_open: editIsOpen
      });
      if (onUpdateMerchant) {
        onUpdateMerchant(updated || {
          store_name: editStoreName.trim(),
          promptpay_id: editPromptPay.trim(),
          location: editLocation.trim(),
          is_open: editIsOpen
        });
      }
      setShowEditModal(false);
    } catch (err) {
      alert("บันทึกข้อมูลร้านค้าไม่สำเร็จ: " + (err?.message || "เกิดข้อผิดพลาด"));
    } finally {
      setSavingProfile(false);
    }
  }

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
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <b>{storeTitle}</b>
            {merchant?.is_approved ? (
              <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "6px", fontSize: "10.5px", fontWeight: 700 }}>อนุมัติแล้ว</span>
            ) : (
              <span style={{ background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: "6px", fontSize: "10.5px", fontWeight: 700 }}>รอแอดมินอนุมัติ</span>
            )}
          </div>
          <small style={{ display: "block" }}>{locationDesc}</small>
          <small style={{ display: "block", color: "#059669", fontWeight: 700, marginTop: "2px" }}>
            💳 พร้อมเพย์: {merchant?.promptpay_id || "ยังไม่ระบุ (กดแก้ไขเพื่อตั้งค่า)"}
          </small>
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            onClick={() => setShowEditModal(true)}
            style={{
              background: "#eff6ff",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              whiteSpace: "nowrap"
            }}
            title="แก้ไขชื่อร้านค้าและเบอร์พร้อมเพย์"
          >
            ⚙️ แก้ไขข้อมูลร้าน
          </button>
          <button 
            onClick={() => go("orders")} 
            style={{
              background: "#ecfdf5",
              color: "#059669",
              border: "1px solid #a7f3d0",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              whiteSpace: "nowrap"
            }}
          >
            ⚡ Real-time
          </button>
          <button 
            onClick={onLogout} 
            style={{ 
              background: "#fff1f2", 
              color: "#e11d48", 
              border: "1px solid #fecdd3",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              whiteSpace: "nowrap"
            }} 
            title="ออกจากระบบร้านค้า"
          >
            🚪 ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Modal แก้ไขข้อมูลร้านค้า & พร้อมเพย์ */}
      {showEditModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditModal(false);
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "18px",
              width: "100%",
              maxWidth: "420px",
              padding: "20px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <b style={{ fontSize: "17px", color: "#0f172a" }}>⚙️ แก้ไขข้อมูลร้านค้า</b>
                <small style={{ display: "block", color: "#64748b", fontSize: "12px" }}>อัปเดตชื่อร้าน พร้อมเพย์รับเงิน และสถานที่ตั้ง</small>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#475569"
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStoreProfile} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  🏪 ชื่อร้านค้า *
                </label>
                <input
                  type="text"
                  required
                  value={editStoreName}
                  onChange={(e) => setEditStoreName(e.target.value)}
                  placeholder="เช่น ตามสั่ง by เชฟเจนนี่"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  💳 เบอร์โทรศัพท์ / เลขพร้อมเพย์รับเงิน (PromptPay ID) *
                </label>
                <input
                  type="text"
                  required
                  value={editPromptPay}
                  onChange={(e) => setEditPromptPay(e.target.value)}
                  placeholder="เบอร์โทร 10 หลัก หรือเลขบัตรประชาชน 13 หลัก"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px"
                  }}
                />
                <small style={{ color: "#64748b", fontSize: "11px" }}>ใช้สำหรับสร้าง QR Code ให้ลูกค้าสแกนชำระเงินอัตโนมัติ</small>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                  📍 ที่ตั้งร้านค้า / ซอย
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="เช่น หลังมอ มจพ. ซอย 11"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px"
                  }}
                />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={editIsOpen}
                  onChange={(e) => setEditIsOpen(e.target.checked)}
                  style={{ width: "16px", height: "16px" }}
                />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                  เปิดรับออเดอร์ (แสดงร้านในหน้าลูกค้า)
                </span>
              </label>

              <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    background: "white",
                    color: "#475569",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  style={{
                    flex: 1.5,
                    padding: "10px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: savingProfile ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)"
                  }}
                >
                  {savingProfile ? "กำลังบันทึก..." : "💾 บันทึกข้อมูลร้าน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SearchBar value={query} onChange={setQuery} placeholder="ค้นหาเลขออเดอร์ หรือชื่อลูกค้า..." />
      
      <div className="merchant-quick">
        <button onClick={() => go("kds")} style={{ background: "#fff7ed", color: "#c2410c", borderColor: "#fed7aa", fontWeight: 700 }}>
          🍳 จอครัว KDS <span>{orders.filter(o => o.status === "PREPARING").length}</span>
        </button>
        <button onClick={() => go("orders")}>ทั้งหมด ({orders.length})</button>
        <button onClick={() => go("orders")}>รอรับ <span>{orders.filter(o => ["PENDING_ACCEPT", "PENDING_PAYMENT"].includes(o.status)).length}</span></button>
        <button onClick={() => go("menus")} style={{ background: "#ecfdf5", color: "#065f46", borderColor: "#a7f3d0" }}>🍲 จัดการเมนู</button>
        <button onClick={() => setShowEditModal(true)} style={{ background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe", fontWeight: 700 }}>⚙️ ตั้งค่าร้าน / พร้อมเพย์</button>
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
        [...orders].sort((a, b) => Number(a.rawId || 0) - Number(b.rawId || 0)).slice(0, 5).map((o) => (
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

function MerchantOrders({ orders, allOrders = [], filter, setFilter, query, setQuery, onBack, updateOrder, onOpenChat, unreadByOrder = {} }) {
  const counts = {
    all: allOrders.length,
    pending: allOrders.filter(o => ["PENDING_ACCEPT", "PENDING_PAYMENT"].includes(o.status)).length,
    preparing: allOrders.filter(o => o.status === "PREPARING").length,
    ready: allOrders.filter(o => o.status === "READY_FOR_DELIVERY").length,
    completed: allOrders.filter(o => ["IN_DELIVERY", "COMPLETED"].includes(o.status)).length
  };

  return (
    <>
      <TopBar title="จัดการออเดอร์" subtitle="Real-time Order Management" onBack={onBack} />
      <SearchBar value={query} onChange={setQuery} placeholder="ค้นหาเลขออเดอร์ หรือลูกค้า..." />
      <div className="filter-scroll merchant-filters">
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
          ทั้งหมด ({counts.all})
        </button>
        <button className={filter === "pending" ? "active" : ""} onClick={() => setFilter("pending")}>
          รอรับ/รอชำระ ({counts.pending})
        </button>
        <button className={filter === "preparing" ? "active" : ""} onClick={() => setFilter("preparing")}>
          กำลังทำ ({counts.preparing})
        </button>
        <button className={filter === "ready" ? "active" : ""} onClick={() => setFilter("ready")}>
          พร้อมจัดส่ง ({counts.ready})
        </button>
        <button className={filter === "completed" ? "active" : ""} onClick={() => setFilter("completed")}>
          จัดส่งสำเร็จ ({counts.completed})
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
              <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => onOpenChat && onOpenChat(o)}
                  style={{
                    position: "relative",
                    background: (unreadByOrder[o.rawId] || unreadByOrder[o.id] || 0) > 0 ? "#ffedd5" : "#f1f5f9",
                    color: (unreadByOrder[o.rawId] || unreadByOrder[o.id] || 0) > 0 ? "#ea580c" : "#334155",
                    border: (unreadByOrder[o.rawId] || unreadByOrder[o.id] || 0) > 0 ? "1.5px solid #f97316" : "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  💬 แชท
                  {(unreadByOrder[o.rawId] || unreadByOrder[o.id] || 0) > 0 && (
                    <span
                      style={{
                        background: "#ea580c",
                        color: "white",
                        borderRadius: "10px",
                        padding: "1px 5px",
                        fontSize: "10px",
                        fontWeight: 800
                      }}
                    >
                      {unreadByOrder[o.rawId] || unreadByOrder[o.id]}
                    </span>
                  )}
                </button>
                {o.status === "PENDING_ACCEPT" && (
                  <>
                    <button className="accept-button" onClick={() => updateOrder(o.id, "PENDING_PAYMENT")}>
                      ✅ รับออเดอร์ (ให้ลูกค้าชำระเงิน)
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
                {o.status === "PENDING_PAYMENT" && (
                  <span style={{ fontSize: "12px", color: "#d97706", fontWeight: 700, background: "#fef3c7", padding: "5px 10px", borderRadius: "8px", border: "1px solid #fde68a" }}>
                    ⏳ รอลูกค้าโอนเงิน & แนบสลิป
                  </span>
                )}
                {o.status === "PAID" && (
                  <button className="accept-button" onClick={() => updateOrder(o.id, "PREPARING")} style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
                    🍳 ลูกค้าชำระแล้ว เริ่มทำอาหาร
                  </button>
                )}
                {o.status === "PREPARING" && (
                  <button className="accept-button" onClick={() => updateOrder(o.id, "READY_FOR_DELIVERY")}>
                    🛵 พร้อมจัดส่ง
                  </button>
                )}
                {o.status === "READY_FOR_DELIVERY" && (
                  ((o.roomNumber && o.roomNumber.includes("รับเอง")) || (o.dormitory && o.dormitory.includes("รับเอง"))) ? (
                    <button 
                      className="accept-button" 
                      onClick={() => updateOrder(o.id, "COMPLETED")} 
                      style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white" }}
                    >
                      ✅ ลูกค้ามารับอาหารแล้ว (เสร็จสิ้น)
                    </button>
                  ) : (
                    <span style={{ fontSize: "12px", color: "#059669", fontWeight: 600 }}>🛵 รอไรเดอร์มารับ</span>
                  )
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

function MerchantDelivery({ orders, deliveryFee, setDeliveryFee, onBack, loadMerchantOrders, onOpenChat }) {
  const [tab, setTab] = useState("dispatch"); // "dispatch" | "soi_fees" | "riders"
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "READY_FOR_DELIVERY" | "IN_DELIVERY" | "COMPLETED"
  const [riders, setRiders] = useState([]);
  const [sois, setSois] = useState([]);
  const [soiFees, setSoiFees] = useState({});
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [assigningOrderId, setAssigningOrderId] = useState(null);

  // Add Rider Modal
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [riderName, setRiderName] = useState("");
  const [riderPhone, setRiderPhone] = useState("");
  const [riderUser, setRiderUser] = useState("");
  const [riderPass, setRiderPass] = useState("");
  const [submittingRider, setSubmittingRider] = useState(false);

  useEffect(() => {
    loadRidersAndFees();
  }, []);

  async function loadRidersAndFees() {
    setLoading(true);
    try {
      const [ridersData, soisData, feesData] = await Promise.all([
        merchantApi.getMyRiders().catch(() => []),
        merchantApi.getSois().catch(() => []),
        merchantApi.getDeliveryFees().catch(() => [])
      ]);

      if (Array.isArray(ridersData)) setRiders(ridersData);
      if (Array.isArray(soisData)) setSois(soisData);

      const feeMap = {};
      (soisData || []).forEach(s => { feeMap[s.id] = 10; });
      (feesData || []).forEach(f => { feeMap[f.soi_id] = parseFloat(f.fee); });
      setSoiFees(feeMap);
    } catch (err) {
      console.warn("Delivery load error:", err);
    } finally {
      setLoading(false);
    }
  }

  // มอบหมาย Rider
  async function handleAssignRider(orderRawId, riderId) {
    try {
      await orderApi.assignRider(orderRawId, riderId);
      setNotice("✅ มอบหมายออเดอร์ให้ไรเดอร์เรียบร้อยแล้ว!");
      setAssigningOrderId(null);
      if (loadMerchantOrders) loadMerchantOrders();
      setTimeout(() => setNotice(""), 3500);
    } catch (err) {
      alert("ไม่สามารถมอบหมายงานได้: " + (err?.response?.data?.message || err.message));
    }
  }

  // ร้านค้าเลือกไปส่งเอง
  async function handleSelfDeliver(orderRawId) {
    try {
      await orderApi.selfDeliver(orderRawId);
      setNotice("🛵 ร้านค้าเลือกจัดส่งออเดอร์นี้ด้วยตนเอง (สถานะ: กำลังนำส่ง)");
      setAssigningOrderId(null);
      if (loadMerchantOrders) loadMerchantOrders();
      setTimeout(() => setNotice(""), 3500);
    } catch (err) {
      alert("ไม่สามารถเปลี่ยนสถานะได้: " + (err?.response?.data?.message || err.message));
    }
  }

  // ส่งสำเร็จ
  async function handleCompleteOrder(orderRawId) {
    try {
      await orderApi.completeOrder(orderRawId);
      setNotice("🎉 บันทึกจัดส่งออเดอร์สำเร็จเรียบร้อย!");
      if (loadMerchantOrders) loadMerchantOrders();
      setTimeout(() => setNotice(""), 3500);
    } catch (err) {
      alert("เกิดข้อผิดพลาด: " + (err?.response?.data?.message || err.message));
    }
  }

  // บันทึกค่าส่งต่อซอย
  async function handleSaveSoiFee(soiId) {
    const fee = soiFees[soiId] ?? 10;
    try {
      await merchantApi.updateDeliveryFee(soiId, fee);
      setNotice(`📍 บันทึกค่าจัดส่งสำเร็จ (฿${fee})`);
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      alert("บันทึกค่าส่งไม่สำเร็จ: " + (err?.response?.data?.error || err.message));
    }
  }

  // ตั้งค่าเท่ากันทุกซอย
  async function handleSetAllFees(fixedFee) {
    const newFees = { ...soiFees };
    for (const s of sois) {
      newFees[s.id] = fixedFee;
    }
    setSoiFees(newFees);
    try {
      for (const s of sois) {
        await merchantApi.updateDeliveryFee(s.id, fixedFee);
      }
      setNotice(`✅ ตั้งค่าจัดส่งทุกซอยเป็น ฿${fixedFee} เรียบร้อยแล้ว`);
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      alert("บันทึกไม่สำเร็จ: " + err.message);
    }
  }

  // สลับสถานะไรเดอร์
  async function handleToggleRider(riderId, currentActive) {
    try {
      await merchantApi.toggleRiderStatus(riderId, !currentActive);
      setRiders(cur => cur.map(r => r.id === riderId ? { ...r, is_active: !currentActive } : r));
    } catch (err) {
      console.warn("Toggle rider error:", err);
    }
  }

  // สร้างไรเดอร์ใหม่
  async function handleCreateRider(e) {
    e.preventDefault();
    if (!riderName || !riderUser || !riderPass) return;
    setSubmittingRider(true);
    try {
      await merchantApi.createRider({
        username: riderUser.trim(),
        password: riderPass,
        full_name: riderName.trim(),
        phone: riderPhone.trim() || undefined
      });
      setNotice("🎉 เพิ่มไรเดอร์ใหม่สำเร็จ! ไรเดอร์สามารถใช้ Username นี้เข้าสู่ระบบได้ทันที");
      setShowRiderModal(false);
      setRiderName("");
      setRiderPhone("");
      setRiderUser("");
      setRiderPass("");
      loadRidersAndFees();
      setTimeout(() => setNotice(""), 4000);
    } catch (err) {
      alert("ไม่สามารถเพิ่มไรเดอร์ได้: " + (err?.response?.data?.message || err.message));
    } finally {
      setSubmittingRider(false);
    }
  }

  const deliveryOrders = orders.filter((o) =>
    ["READY_FOR_DELIVERY", "IN_DELIVERY", "COMPLETED"].includes(o.status)
  );
  const readyCount = deliveryOrders.filter(o => o.status === "READY_FOR_DELIVERY").length;
  const inDeliveryCount = deliveryOrders.filter(o => o.status === "IN_DELIVERY").length;
  const completedCount = deliveryOrders.filter(o => o.status === "COMPLETED").length;

  const filteredDeliveryOrders = statusFilter === "ALL"
    ? deliveryOrders
    : deliveryOrders.filter(o => o.status === statusFilter);

  return (
    <div style={{ paddingBottom: "30px" }}>
      <TopBar title="ศูนย์จัดการการจัดส่ง" subtitle="Delivery & Rider Management" onBack={onBack} />

      {notice && (
        <div style={{
          background: "#059669",
          color: "white",
          padding: "10px 14px",
          borderRadius: "12px",
          margin: "10px 12px",
          fontSize: "13px",
          textAlign: "center",
          fontWeight: 600,
          boxShadow: "0 4px 14px rgba(5, 150, 105, 0.25)"
        }}>
          {notice}
        </div>
      )}

      {/* Sub Tabs */}
      <div style={{
        display: "flex",
        gap: "6px",
        padding: "8px 12px 14px",
        overflowX: "auto"
      }}>
        <button
          onClick={() => setTab("dispatch")}
          style={{
            flex: 1,
            padding: "9px 12px",
            borderRadius: "10px",
            border: tab === "dispatch" ? "none" : "1px solid #e2e8f0",
            background: tab === "dispatch" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "white",
            color: tab === "dispatch" ? "white" : "#475569",
            fontWeight: 700,
            fontSize: "12px",
            whiteSpace: "nowrap",
            boxShadow: tab === "dispatch" ? "0 4px 10px rgba(5, 150, 105, 0.2)" : "none",
            cursor: "pointer"
          }}
        >
          🛵 มอบหมายจัดส่ง ({deliveryOrders.filter(o => o.status === "READY_FOR_DELIVERY").length})
        </button>

        <button
          onClick={() => setTab("soi_fees")}
          style={{
            flex: 1,
            padding: "9px 12px",
            borderRadius: "10px",
            border: tab === "soi_fees" ? "none" : "1px solid #e2e8f0",
            background: tab === "soi_fees" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "white",
            color: tab === "soi_fees" ? "white" : "#475569",
            fontWeight: 700,
            fontSize: "12px",
            whiteSpace: "nowrap",
            boxShadow: tab === "soi_fees" ? "0 4px 10px rgba(5, 150, 105, 0.2)" : "none",
            cursor: "pointer"
          }}
        >
          📍 ค่าส่งตามซอย ({sois.length})
        </button>

        <button
          onClick={() => setTab("riders")}
          style={{
            flex: 1,
            padding: "9px 12px",
            borderRadius: "10px",
            border: tab === "riders" ? "none" : "1px solid #e2e8f0",
            background: tab === "riders" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "white",
            color: tab === "riders" ? "white" : "#475569",
            fontWeight: 700,
            fontSize: "12px",
            whiteSpace: "nowrap",
            boxShadow: tab === "riders" ? "0 4px 10px rgba(5, 150, 105, 0.2)" : "none",
            cursor: "pointer"
          }}
        >
          👥 ไรเดอร์ ({riders.length})
        </button>
      </div>

      {/* --- TAB 1: งานจัดส่ง & มอบหมายไรเดอร์ --- */}
      {tab === "dispatch" && (
        <div style={{ padding: "0 12px" }}>
          <div style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <b style={{ fontSize: "14px", color: "#334155" }}>รายการออเดอร์จัดส่ง</b>
            <span style={{ fontSize: "12px", color: "#64748b" }}>{filteredDeliveryOrders.length} รายการ</span>
          </div>

          {/* ตัวกรองสถานะออเดอร์ในหน้าจัดส่ง */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "14px", overflowX: "auto", paddingBottom: "4px" }}>
            {[
              { key: "ALL", label: `ทั้งหมด (${deliveryOrders.length})` },
              { key: "READY_FOR_DELIVERY", label: `พร้อมจัดส่ง (${readyCount})` },
              { key: "IN_DELIVERY", label: `กำลังจัดส่ง (${inDeliveryCount})` },
              { key: "COMPLETED", label: `จัดส่งสำเร็จ (${completedCount})` }
            ].map((f) => {
              const active = statusFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "20px",
                    border: active ? "none" : "1px solid #cbd5e1",
                    background: active ? "#059669" : "#f8fafc",
                    color: active ? "white" : "#475569",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s"
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {filteredDeliveryOrders.length > 0 ? (
            filteredDeliveryOrders.map((o) => (
              <div
                key={o.id}
                style={{
                  background: "white",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  marginBottom: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <b style={{ fontSize: "15px", color: "#1e293b" }}>{o.customer}</b>
                      {o.customerPhone && <span style={{ fontSize: "12px", color: "#64748b" }}>📞 {o.customerPhone}</span>}
                    </div>
                    <small style={{ color: "#64748b", display: "block" }}>Order ID: {o.id} · {o.time}</small>
                    {o.roomNumber && (
                      <div style={{ fontSize: "13px", color: "#0284c7", fontWeight: 600, marginTop: "3px" }}>
                        📍 {o.roomNumber}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong style={{ fontSize: "16px", color: "#0f172a" }}>฿{o.total}</strong>
                    {o.deliveryFee > 0 && <small style={{ display: "block", color: "#64748b", fontSize: "11px" }}>ค่าส่ง ฿{o.deliveryFee}</small>}
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "8px", margin: "8px 0", fontSize: "12px", color: "#475569" }}>
                  {o.items?.map((it, i) => (
                    <div key={i} style={{ padding: "2px 0" }}>• {it}</div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <StatusPill tone={o.status === "READY_FOR_DELIVERY" ? "yellow" : o.status === "IN_DELIVERY" ? "orange" : "green"}>
                      {statusLabel[o.status] || o.status}
                    </StatusPill>
                    <button
                      type="button"
                      onClick={() => onOpenChat && onOpenChat(o)}
                      style={{
                        background: "#f8fafc",
                        color: "#334155",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        padding: "5px 10px",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      💬 แชท
                    </button>
                  </div>

                  {/* Actions for READY_FOR_DELIVERY */}
                  {o.status === "READY_FOR_DELIVERY" && (
                    <button
                      onClick={() => setAssigningOrderId(assigningOrderId === o.id ? null : o.id)}
                      style={{
                        background: "#059669",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        padding: "7px 14px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(5,150,105,0.3)"
                      }}
                    >
                      {assigningOrderId === o.id ? "✕ ปิดตัวเลือก" : "🛵 มอบหมายผู้จัดส่ง"}
                    </button>
                  )}

                  {/* Actions for IN_DELIVERY */}
                  {o.status === "IN_DELIVERY" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: 600 }}>🚴‍♂️ กำลังนำส่ง</span>
                      <button
                        onClick={() => handleCompleteOrder(o.rawId)}
                        style={{
                          background: "#16a34a",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        ✅ จัดส่งถึงแล้ว
                      </button>
                    </div>
                  )}

                  {o.status === "COMPLETED" && (
                    <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>✅ ส่งมอบอาหารสำเร็จแล้ว</span>
                  )}
                </div>

                {/* Assignment Dropdown Panel */}
                {assigningOrderId === o.id && (
                  <div style={{
                    marginTop: "12px",
                    padding: "12px",
                    background: "#ecfdf5",
                    border: "1.5px solid #a7f3d0",
                    borderRadius: "10px"
                  }}>
                    <b style={{ fontSize: "13px", color: "#065f46", display: "block", marginBottom: "8px" }}>
                      🛵 เลือกผู้ที่จะไปจัดส่งออเดอร์นี้:
                    </b>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {/* รายชื่อ Riders */}
                      {riders.filter(r => r.is_active).length > 0 ? (
                        riders.filter(r => r.is_active).map(r => (
                          <button
                            key={r.id}
                            onClick={() => handleAssignRider(o.rawId, r.id)}
                            style={{
                              background: "white",
                              border: "1px solid #10b981",
                              color: "#065f46",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              textAlign: "left",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            <span>🛵 ส่งให้: <b>{r.full_name}</b> {r.phone && <small>({r.phone})</small>}</span>
                            <span style={{ color: "#059669", fontSize: "11px" }}>มอบหมาย ›</span>
                          </button>
                        ))
                      ) : (
                        <div style={{ fontSize: "12px", color: "#94a3b8", padding: "4px 0" }}>
                          (ไม่มีไรเดอร์ว่างในขณะนี้ สามารถเพิ่มไรเดอร์ที่แท็บ 'ไรเดอร์' หรือเลือกส่งเองด้านล่าง)
                        </div>
                      )}

                      {/* ตัวเลือกร้านส่งเอง */}
                      <button
                        onClick={() => handleSelfDeliver(o.rawId)}
                        style={{
                          background: "linear-gradient(135deg, #ff7a18 0%, #ff5200 100%)",
                          color: "white",
                          border: "none",
                          padding: "10px 14px",
                          borderRadius: "8px",
                          textAlign: "center",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor: "pointer",
                          boxShadow: "0 3px 8px rgba(255,82,0,0.25)"
                        }}
                      >
                        🏪 ร้านค้าเลือกไปส่งเอง (Self Delivery)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <EmptyState
              title="ไม่มีออเดอร์ในขั้นตอนจัดส่ง"
              text="เมื่ออาหารปรุงเสร็จแล้วและกด 'พร้อมจัดส่ง' ออเดอร์จะมาปรากฏที่นี่เพื่อให้มอบหมายไรเดอร์หรือเลือกส่งเอง"
            />
          )}
        </div>
      )}

      {/* --- TAB 2: จัดการค่าจัดส่งตามซอย --- */}
      {tab === "soi_fees" && (
        <div style={{ padding: "0 12px" }}>
          {/* Quick batch set */}
          <div style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "14px 16px",
            marginBottom: "14px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
          }}>
            <b style={{ fontSize: "14px", color: "#1e293b", display: "block", marginBottom: "4px" }}>
              ⚡ ตั้งค่าส่งเท่ากันทุกซอยอย่างรวดเร็ว
            </b>
            <small style={{ color: "#64748b", display: "block", marginBottom: "10px" }}>
              กดเลือกราคาเพื่อนำไปใช้กับทุกซอยโดยอัตโนมัติ
            </small>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[0, 10, 15, 20, 25].map(amt => (
                <button
                  key={amt}
                  onClick={() => handleSetAllFees(amt)}
                  style={{
                    flex: amt === 0 ? "1.2" : "1",
                    background: amt === 0 ? "#ecfdf5" : "#f1f5f9",
                    color: amt === 0 ? "#059669" : "#334155",
                    border: amt === 0 ? "1px solid #a7f3d0" : "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "8px 6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {amt === 0 ? "฿0 (ฟรีค่าส่ง)" : `฿${amt}`}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <b style={{ fontSize: "14px", color: "#334155" }}>กำหนดค่าส่งแยกตามซอย</b>
            <small style={{ color: "#64748b" }}>รอบมหาวิทยาลัย มจพ.</small>
          </div>

          {/* List of Sois */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {sois.map(soi => {
              const currentFee = soiFees[soi.id] ?? 10;
              return (
                <div
                  key={soi.id}
                  style={{
                    background: "white",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                  }}
                >
                  <div>
                    <b style={{ fontSize: "15px", color: "#1e293b", display: "block" }}>📍 {soi.name}</b>
                    <small style={{ color: "#64748b" }}>หอพักในพื้นที่ {soi.name}</small>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: "8px", overflow: "hidden" }}>
                      <button
                        onClick={() => {
                          const next = Math.max(0, currentFee - 5);
                          setSoiFees(prev => ({ ...prev, [soi.id]: next }));
                        }}
                        style={{ border: "none", background: "#f8fafc", padding: "6px 10px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={currentFee}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setSoiFees(prev => ({ ...prev, [soi.id]: val }));
                        }}
                        style={{ width: "45px", border: "none", textAlign: "center", fontSize: "14px", fontWeight: 700, outline: "none" }}
                      />
                      <button
                        onClick={() => {
                          const next = currentFee + 5;
                          setSoiFees(prev => ({ ...prev, [soi.id]: next }));
                        }}
                        style={{ border: "none", background: "#f8fafc", padding: "6px 10px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => handleSaveSoiFee(soi.id)}
                      style={{
                        background: "#059669",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      บันทึก
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB 3: ไรเดอร์ของร้านค้า --- */}
      {tab === "riders" && (
        <div style={{ padding: "0 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <b style={{ fontSize: "15px", color: "#1e293b", display: "block" }}>พนักงานส่งอาหารของร้าน</b>
              <small style={{ color: "#64748b" }}>จัดการไรเดอร์และบัญชีเข้าสู่ระบบ</small>
            </div>
            <button
              onClick={() => setShowRiderModal(true)}
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                padding: "8px 14px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)"
              }}
            >
              ＋ เพิ่มไรเดอร์ใหม่
            </button>
          </div>

          {riders.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {riders.map(r => (
                <div
                  key={r.id}
                  style={{
                    background: "white",
                    borderRadius: "14px",
                    padding: "14px 16px",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "#e0f2fe",
                      color: "#0369a1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px"
                    }}>
                      🛵
                    </div>
                    <div>
                      <b style={{ fontSize: "15px", color: "#1e293b", display: "block" }}>{r.full_name}</b>
                      <small style={{ color: "#64748b", display: "block" }}>
                        Username: <b>{r.username}</b> {r.phone ? `· 📞 ${r.phone}` : ""}
                      </small>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleRider(r.id, r.is_active)}
                    style={{
                      background: r.is_active ? "#ecfdf5" : "#f1f5f9",
                      color: r.is_active ? "#059669" : "#64748b",
                      border: r.is_active ? "1px solid #a7f3d0" : "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    {r.is_active ? "● พร้อมรับงาน" : "○ พักงาน"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="ยังไม่มีไรเดอร์ในร้านของคุณ"
              text="กดปุ่ม '＋ เพิ่มไรเดอร์ใหม่' ด้านบน เพื่อสร้างบัญชีให้ไรเดอร์ประจำร้านเข้าสู่ระบบ"
            />
          )}

          {/* Modal เพิ่มไรเดอร์ใหม่ */}
          {showRiderModal && (
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
                  <b style={{ fontSize: "17px", color: "#1e293b" }}>🛵 เพิ่มพนักงานส่งอาหารใหม่</b>
                  <button onClick={() => setShowRiderModal(false)} style={{ border: "none", background: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}>✕</button>
                </div>

                <form onSubmit={handleCreateRider} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="auth-field-group">
                    <label>ชื่อ-นามสกุลไรเดอร์ *</label>
                    <input
                      type="text"
                      placeholder="เช่น สมชาย วิ่งไว"
                      value={riderName}
                      onChange={(e) => setRiderName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="auth-field-group">
                    <label>เบอร์โทรศัพท์สำหรับติดต่อ</label>
                    <input
                      type="tel"
                      placeholder="เช่น 0891234567"
                      value={riderPhone}
                      onChange={(e) => setRiderPhone(e.target.value)}
                    />
                  </div>

                  <div className="auth-field-group">
                    <label>ชื่อผู้ใช้งาน (Username สำหรับล็อกอิน) *</label>
                    <input
                      type="text"
                      placeholder="เช่น rider_somchai"
                      value={riderUser}
                      onChange={(e) => setRiderUser(e.target.value)}
                      required
                    />
                  </div>

                  <div className="auth-field-group">
                    <label>รหัสผ่าน (Password) *</label>
                    <input
                      type="password"
                      placeholder="กำหนดรหัสผ่านอย่างน้อย 6 ตัวอักษร"
                      value={riderPass}
                      onChange={(e) => setRiderPass(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setShowRiderModal(false)}
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
                      disabled={submittingRider}
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
                      {submittingRider ? "กำลังบันทึก..." : "บันทึกข้อมูลไรเดอร์"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MerchantChat({ orders, initialOrder, onBack, onUnreadChange }) {
  const activeChatOrders = useMemo(() => {
    const active = orders.filter(o => !["REJECTED_BY_MERCHANT", "CANCELLED_BY_CUSTOMER", "CANCELLED_BY_TIMEOUT"].includes(o.status));
    return active.length > 0 ? active : orders;
  }, [orders]);

  const [selectedOrder, setSelectedOrder] = useState(
    initialOrder || activeChatOrders[0] || orders[0] || null
  );
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const orderId = selectedOrder?.rawId || (selectedOrder?.id ? Number(String(selectedOrder.id).replace(/\D/g, "")) : null);

  useEffect(() => {
    if (!orderId) return;
    let isMounted = true;

    async function loadChat() {
      setLoading(true);
      try {
        const res = await orderApi.getChatHistory(orderId, "MERCHANT");
        const list = Array.isArray(res) ? res : (res?.data || res?.messages || []);
        if (isMounted) {
          setMessages(list);
          if (list.length > 0) {
            const last = list[list.length - 1];
            if (last?.id) {
              await orderApi.markAsRead(orderId, last.id, "MERCHANT").catch(() => null);
              if (onUnreadChange) onUnreadChange(0);
            }
          }
        }
      } catch (err) {
        console.warn("Could not load merchant chat:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadChat();

    const socket = getSocket("MERCHANT");
    if (socket) {
      socket.emit("join_order_room", { orderId: Number(orderId), order_id: Number(orderId) });

      const handleIncoming = (payload) => {
        if (Number(payload.order_id || payload.orderId) === Number(orderId)) {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.id)) return prev;
            return [...prev, payload];
          });
          playOrderChime();
          if (payload.id) {
            orderApi.markAsRead(orderId, payload.id, "MERCHANT").catch(() => null);
          }
        }
      };

      socket.on("new_message", handleIncoming);
      socket.on("NEW_CHAT_MESSAGE", handleIncoming);

      return () => {
        isMounted = false;
        socket.off("new_message", handleIncoming);
        socket.off("NEW_CHAT_MESSAGE", handleIncoming);
      };
    }
  }, [orderId]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !orderId || sending) return;

    const content = text.trim();
    setText("");
    setSending(true);

    try {
      const res = await orderApi.sendMessage(orderId, content, "MERCHANT");
      const newMsg = res?.data || (res?.id ? res : null);
      if (newMsg) {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    } catch (err) {
      alert("ส่งข้อความไม่สำเร็จ: " + (err?.response?.data?.error || err.message));
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f8fafc" }}>
      <TopBar 
        title={selectedOrder ? `แชท: ${selectedOrder.customer || "ลูกค้า"}` : "แชทติดต่อออเดอร์"} 
        subtitle={selectedOrder ? `${selectedOrder.id} · แชทกลุ่ม 3 คน (ลูกค้า / ร้าน / ไรเดอร์)` : "เลือกออเดอร์เพื่อเริ่มสนทนา"} 
        onBack={onBack} 
      />

      {/* แถบเลือกออเดอร์ด้านบนแบบ Scrollable */}
      <div style={{
        display: "flex",
        gap: "8px",
        padding: "8px 12px",
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        overflowX: "auto",
        whiteSpace: "nowrap"
      }}>
        {activeChatOrders.length > 0 ? (
          activeChatOrders.map((ord) => {
            const isSelected = selectedOrder?.id === ord.id;
            return (
              <button
                key={ord.id}
                type="button"
                onClick={() => setSelectedOrder(ord)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  border: isSelected ? "1.5px solid #10b981" : "1px solid #cbd5e1",
                  background: isSelected ? "#ecfdf5" : "#f1f5f9",
                  color: isSelected ? "#065f46" : "#475569",
                  fontSize: "12px",
                  fontWeight: isSelected ? 800 : 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  flexShrink: 0
                }}
              >
                <span>{ord.id}</span>
                <span style={{ opacity: 0.8 }}>({ord.customer?.slice(0, 8)})</span>
              </button>
            );
          })
        ) : (
          <span style={{ fontSize: "12px", color: "#94a3b8", padding: "4px" }}>ไม่มีออเดอร์ในขณะนี้</span>
        )}
      </div>

      {/* กล่องข้อความแชท 3 คน (ลูกค้า, ร้านค้า, ไรเดอร์) */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px 80px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", padding: "40px 0" }}>
            กำลังโหลดข้อความ...
          </div>
        ) : !selectedOrder ? (
          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", padding: "40px 0" }}>
            กรุณาเลือกออเดอร์ด้านบนเพื่อเปิดห้องแชท
          </div>
        ) : messages.length > 0 ? (
          messages.map((m, i) => {
            const isMe = m.is_merchant_sender && m.sender_sub_role !== "RIDER";
            const isRider = m.sender_sub_role === "RIDER";
            const isCustomer = !m.is_merchant_sender;

            return (
              <div
                key={m.id || i}
                style={{
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  maxWidth: "78%",
                  padding: "10px 14px",
                  borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                  background: isMe 
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" 
                    : isRider 
                    ? "#fffbeb" 
                    : "#ffffff",
                  color: isMe ? "white" : "#1e293b",
                  border: isMe ? "none" : isRider ? "1.5px solid #fde68a" : "1px solid #e2e8f0",
                  fontSize: "13px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
                }}
              >
                <small style={{
                  display: "block",
                  color: isMe ? "rgba(255,255,255,0.85)" : isRider ? "#d97706" : "#64748b",
                  fontSize: "10px",
                  fontWeight: 700,
                  marginBottom: "2px"
                }}>
                  {isMe ? "🍲 ร้านค้า (คุณ)" : isRider ? "🛵 ไรเดอร์" : `👤 ลูกค้า (${selectedOrder.customer || "ลูกค้า"})`}
                </small>
                <div>{m.content_text || m.text}</div>
                <small style={{
                  display: "block",
                  textAlign: "right",
                  fontSize: "9px",
                  opacity: 0.8,
                  marginTop: "4px"
                }}>
                  {m.created_at ? new Date(m.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : ""}
                </small>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", padding: "40px 0" }}>
            💬 ยังไม่มีข้อความในออเดอร์นี้ พิมพ์ทักทายลูกค้าและไรเดอร์ได้เลยครับ
          </div>
        )}
      </div>

      {/* กล่องพิมพ์ข้อความ */}
      {selectedOrder && (
        <form
          onSubmit={handleSend}
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "white",
            borderTop: "1px solid #e2e8f0",
            padding: "10px 14px",
            display: "flex",
            gap: "8px",
            alignItems: "center",
            zIndex: 99
          }}
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`พิมพ์ข้อความตอบกลับ ${selectedOrder.customer || "ลูกค้า"} และไรเดอร์...`}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "20px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              outline: "none"
            }}
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            style={{
              background: text.trim() ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "#cbd5e1",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              cursor: text.trim() ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px"
            }}
          >
            ➤
          </button>
        </form>
      )}
    </div>
  );
}

function MerchantMenus({ merchant, onBack }) {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  // Edit Menu State
  const [editingMenu, setEditingMenu] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Option Group & Choice Form State
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupRequired, setNewGroupRequired] = useState(false);
  const [newGroupMultiple, setNewGroupMultiple] = useState(false);
  const [addingGroup, setAddingGroup] = useState(false);

  const [activeGroupId, setActiveGroupId] = useState(null);
  const [newChoiceName, setNewChoiceName] = useState("");
  const [newChoicePrice, setNewChoicePrice] = useState("0");
  const [addingChoice, setAddingChoice] = useState(false);

  useEffect(() => {
    loadMenus();
  }, [merchant?.id]);

  async function loadMenus() {
    setLoading(true);
    try {
      // ดึงเมนูทั้งหมดของร้านค้าพร้อม option groups และ choices
      const data = await merchantApi.getMyMenus();
      if (Array.isArray(data)) {
        setMenus(data);
        // หากกำลังเปิด Edit Modal เมนูไหนอยู่ ให้ update ข้อมูลล่าสุดด้วย
        if (editingMenu) {
          const fresh = data.find(m => m.id === editingMenu.id);
          if (fresh) setEditingMenu(fresh);
        }
      }
    } catch (err) {
      console.warn("Could not load my menus:", err);
      // Fallback
      if (merchant?.id) {
        try {
          const fallback = await merchantApi.getMerchantMenu(merchant.id);
          if (Array.isArray(fallback)) setMenus(fallback);
        } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  }

  // อัพโหลดรูปภาพเมนูใหม่
  async function handleImageUpload(e, isEdit = false) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isEdit) {
      setUploadingEditImage(true);
    } else {
      setUploadingImage(true);
    }

    try {
      const uploadedUrl = await merchantApi.uploadMenuImage(file);
      if (uploadedUrl) {
        if (isEdit) {
          setEditImageUrl(uploadedUrl);
        } else {
          setImageUrl(uploadedUrl);
        }
        setNotice("✅ อัปโหลดรูปภาพสำเร็จ!");
        setTimeout(() => setNotice(""), 3000);
      }
    } catch (err) {
      alert("ไม่สามารถอัปโหลดรูปภาพได้: " + (err?.response?.data?.error || err.message));
    } finally {
      if (isEdit) {
        setUploadingEditImage(false);
      } else {
        setUploadingImage(false);
      }
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
        image_url: imageUrl || undefined,
        is_available: true
      });
      setNotice("✅ เพิ่มเมนูอาหารสำเร็จ!");
      setName("");
      setPrice("");
      setDescription("");
      setImageUrl("");
      setShowAddModal(false);
      await loadMenus();
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      alert("ไม่สามารถเพิ่มเมนูได้: " + (err?.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  }

  function openEditModal(item) {
    setEditingMenu(item);
    setEditName(item.name || "");
    setEditPrice(item.price || "");
    setEditDesc(item.description || "");
    setEditImageUrl(item.image_url || "");
    setNewGroupName("");
    setNewChoiceName("");
    setNewChoicePrice("0");
    setActiveGroupId(null);
  }

  async function handleUpdateMenu(e) {
    e.preventDefault();
    if (!editName.trim() || !editPrice || !editingMenu) return;
    setSubmittingEdit(true);
    try {
      await merchantApi.updateMenu(editingMenu.id, {
        name: editName.trim(),
        price: parseFloat(editPrice),
        description: editDesc.trim() || undefined,
        image_url: editImageUrl || undefined
      });
      setNotice("✅ บันทึกข้อมูลเมนูสำเร็จ!");
      setEditingMenu(null);
      await loadMenus();
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      alert("ไม่สามารถแก้ไขเมนูได้: " + (err?.response?.data?.error || err.message));
    } finally {
      setSubmittingEdit(false);
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
    if (!confirm("คุณแน่ใจว่าต้องการลบเมนูนี้ใช่หรือไม่? ข้อมูลและตัวเลือกทั้งหมดจะถูกลบอย่างถาวร")) return;
    try {
      await merchantApi.deleteMenu(menuId);
      setMenus(current => current.filter(m => m.id !== menuId));
      if (editingMenu?.id === menuId) setEditingMenu(null);
      setNotice("✅ ลบเมนูอาหารเรียบร้อยแล้ว");
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      alert("ไม่สามารถลบเมนูได้: " + (err?.response?.data?.error || err.message));
    }
  }

  // จัดการกลุ่มตัวเลือก (Option Groups)
  async function handleAddOptionGroup(e) {
    e.preventDefault();
    if (!newGroupName.trim() || !editingMenu) return;
    setAddingGroup(true);
    try {
      await merchantApi.createOptionGroup(editingMenu.id, {
        name: newGroupName.trim(),
        is_required: Boolean(newGroupRequired),
        allow_multiple: Boolean(newGroupMultiple)
      });
      setNewGroupName("");
      setNewGroupRequired(false);
      setNewGroupMultiple(false);
      await loadMenus();
      setNotice("✅ เพิ่มกลุ่มตัวเลือกสำเร็จ!");
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      alert("ไม่สามารถเพิ่มกลุ่มตัวเลือกได้: " + (err?.response?.data?.error || err.message));
    } finally {
      setAddingGroup(false);
    }
  }

  async function handleDeleteOptionGroup(groupId) {
    if (!confirm("ต้องการลบกลุ่มตัวเลือกนี้และตัวเลือกย่อยทั้งหมดใช่หรือไม่?")) return;
    try {
      await merchantApi.deleteOptionGroup(groupId);
      await loadMenus();
      setNotice("✅ ลบกลุ่มตัวเลือกแล้ว");
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      alert("ไม่สามารถลบกลุ่มตัวเลือกได้: " + (err?.response?.data?.error || err.message));
    }
  }

  // จัดการตัวเลือกย่อย (Option Choices)
  async function handleAddOptionChoice(e, groupId) {
    e.preventDefault();
    if (!newChoiceName.trim() || !groupId) return;
    setAddingChoice(true);
    try {
      await merchantApi.createOptionChoice(groupId, {
        name: newChoiceName.trim(),
        extra_price: parseFloat(newChoicePrice) || 0
      });
      setNewChoiceName("");
      setNewChoicePrice("0");
      setActiveGroupId(null);
      await loadMenus();
      setNotice("✅ เพิ่มตัวเลือกสำเร็จ!");
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      alert("ไม่สามารถเพิ่มตัวเลือกได้: " + (err?.response?.data?.error || err.message));
    } finally {
      setAddingChoice(false);
    }
  }

  async function handleDeleteOptionChoice(choiceId) {
    if (!confirm("ต้องการลบตัวเลือกนี้ใช่หรือไม่?")) return;
    try {
      await merchantApi.deleteOptionChoice(choiceId);
      await loadMenus();
      setNotice("✅ ลบตัวเลือกแล้ว");
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      alert("ไม่สามารถลบตัวเลือกได้: " + (err?.response?.data?.error || err.message));
    }
  }

  return (
    <div style={{ paddingBottom: "30px" }}>
      <TopBar title="จัดการเมนูอาหาร" subtitle={`${merchant?.store_name || "ร้านอาหาร"} (${menus.length} รายการ)`} onBack={onBack} />
      
      {notice && (
        <div style={{ background: "#2f855a", color: "white", padding: "10px 14px", borderRadius: "10px", margin: "10px 12px", textAlign: "center", fontSize: "13px", fontWeight: 600 }}>
          {notice}
        </div>
      )}

      <div style={{ padding: "0 12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <b style={{ fontSize: "16px", color: "#1e293b" }}>รายการอาหารของร้าน</b>
          <small style={{ display: "block", color: "#64748b" }}>จัดการราคา ตัวเลือก รูปภาพ และสถานะขาย</small>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            setImageUrl("");
          }}
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
            maxWidth: "440px",
            maxHeight: "90vh",
            overflowY: "auto",
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
                  rows={2}
                />
              </div>

              {/* อัปโหลดรูปภาพเมนู */}
              <div className="auth-field-group">
                <label>รูปภาพเมนูอาหาร</label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
                  {imageUrl ? (
                    <div style={{ position: "relative" }}>
                      <img
                        src={imageUrl}
                        alt="Menu Preview"
                        style={{ width: "64px", height: "64px", borderRadius: "10px", objectFit: "cover", border: "1px solid #e2e8f0" }}
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        style={{
                          position: "absolute",
                          top: -6,
                          right: -6,
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          fontSize: "10px",
                          cursor: "pointer"
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "10px",
                      background: "#f1f5f9",
                      border: "1px dashed #cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px"
                    }}>
                      📷
                    </div>
                  )}

                  <label style={{
                    flex: 1,
                    display: "inline-block",
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#334155",
                    textAlign: "center",
                    cursor: uploadingImage ? "not-allowed" : "pointer"
                  }}>
                    {uploadingImage ? "⏳ กำลังอัปโหลด..." : "📁 เลือกไฟล์รูปภาพ"}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      disabled={uploadingImage}
                      onChange={(e) => handleImageUpload(e, false)}
                    />
                  </label>
                </div>
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
                  disabled={submitting || uploadingImage}
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

      {/* Modal แก้ไขเมนูอาหาร พร้อมจัดการรูปภาพและกลุ่มตัวเลือก */}
      {editingMenu && (
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
            maxWidth: "480px",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <b style={{ fontSize: "18px", color: "#1e293b" }}>✏️ แก้ไขเมนูและตัวเลือก</b>
              <button onClick={() => setEditingMenu(null)} style={{ border: "none", background: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            {/* ฟอร์มแก้ไขข้อมูลทั่วไปของเมนู */}
            <form onSubmit={handleUpdateMenu} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="auth-field-group">
                <label>ชื่อเมนูอาหาร *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field-group">
                <label>ราคา (บาท) *</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  required
                  min="0"
                  step="1"
                />
              </div>

              <div className="auth-field-group">
                <label>รายละเอียด / ส่วนผสม</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                />
              </div>

              {/* อัปโหลดรูปภาพเมนูในโหมดแก้ไข */}
              <div className="auth-field-group">
                <label>รูปภาพเมนูอาหาร</label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
                  {editImageUrl ? (
                    <div style={{ position: "relative" }}>
                      <img
                        src={editImageUrl}
                        alt="Menu"
                        style={{ width: "64px", height: "64px", borderRadius: "10px", objectFit: "cover", border: "1px solid #e2e8f0" }}
                      />
                      <button
                        type="button"
                        onClick={() => setEditImageUrl("")}
                        style={{
                          position: "absolute",
                          top: -6,
                          right: -6,
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          fontSize: "10px",
                          cursor: "pointer"
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "10px",
                      background: "#f1f5f9",
                      border: "1px dashed #cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px"
                    }}>
                      📷
                    </div>
                  )}

                  <label style={{
                    flex: 1,
                    display: "inline-block",
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#334155",
                    textAlign: "center",
                    cursor: uploadingEditImage ? "not-allowed" : "pointer"
                  }}>
                    {uploadingEditImage ? "⏳ กำลังอัปโหลด..." : "📁 เปลี่ยนรูปภาพ"}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      disabled={uploadingEditImage}
                      onChange={(e) => handleImageUpload(e, true)}
                    />
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button
                  type="submit"
                  disabled={submittingEdit || uploadingEditImage}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  {submittingEdit ? "กำลังบันทึก..." : "💾 บันทึกข้อมูลเมนู"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(editingMenu.id)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #fecaca",
                    background: "#fef2f2",
                    color: "#dc2626",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  ลบเมนูนี้
                </button>
              </div>
            </form>

            <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "20px 0" }} />

            {/* จัดการกลุ่มตัวเลือก (Option Groups & Choices) */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div>
                  <b style={{ fontSize: "15px", color: "#1e293b", display: "block" }}>⚙️ ตัวเลือกของเมนูนี้</b>
                  <small style={{ color: "#64748b" }}>เช่น ระดับความเผ็ด, ท็อปปิ้งเสริม, ประเภทเส้น</small>
                </div>
              </div>

              {/* รายการกลุ่มตัวเลือกเดิม */}
              {editingMenu.option_groups && editingMenu.option_groups.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                  {editingMenu.option_groups.map((group) => (
                    <div
                      key={group.id}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "12px",
                        background: "#f8fafc"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div>
                          <b style={{ fontSize: "14px", color: "#1e293b" }}>{group.name}</b>
                          <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
                            <span style={{
                              fontSize: "10px",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: group.is_required ? "#fee2e2" : "#f1f5f9",
                              color: group.is_required ? "#dc2626" : "#64748b",
                              fontWeight: 600
                            }}>
                              {group.is_required ? "จำเป็นต้องเลือก" : "ไม่บังคับ"}
                            </span>
                            <span style={{
                              fontSize: "10px",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: "#e0f2fe",
                              color: "#0369a1",
                              fontWeight: 600
                            }}>
                              {group.allow_multiple ? "เลือกได้หลายอย่าง" : "เลือกได้ข้อเดียว"}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteOptionGroup(group.id)}
                          style={{
                            background: "#fee2e2",
                            color: "#dc2626",
                            border: "1px solid #fca5a5",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          ลบกลุ่ม
                        </button>
                      </div>

                      {/* ตัวเลือกย่อยในกลุ่มนี้ */}
                      <div style={{ paddingLeft: "6px", display: "flex", flexDirection: "column", gap: "4px", marginBottom: "8px" }}>
                        {group.choices && group.choices.length > 0 ? (
                          group.choices.map((choice) => (
                            <div
                              key={choice.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                background: "white",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                border: "1px solid #e2e8f0",
                                fontSize: "12px"
                              }}
                            >
                              <span style={{ color: "#334155" }}>{choice.name}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ color: choice.extra_price > 0 ? "#10b981" : "#64748b", fontWeight: 600 }}>
                                  {choice.extra_price > 0 ? `+฿${choice.extra_price}` : "+฿0"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOptionChoice(choice.id)}
                                  style={{
                                    border: "none",
                                    background: "none",
                                    color: "#94a3b8",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    padding: "0 2px"
                                  }}
                                  title="ลบตัวเลือกนี้"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic", padding: "4px 0" }}>
                            ยังไม่มีตัวเลือกในกลุ่มนี้
                          </div>
                        )}
                      </div>

                      {/* ฟอร์มเพิ่มตัวเลือกย่อยในกลุ่ม */}
                      {activeGroupId === group.id ? (
                        <form
                          onSubmit={(e) => handleAddOptionChoice(e, group.id)}
                          style={{
                            background: "white",
                            padding: "8px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            display: "flex",
                            gap: "6px",
                            alignItems: "center"
                          }}
                        >
                          <input
                            type="text"
                            placeholder="ชื่อตัวเลือก เช่น เผ็ดมาก / ไข่ดาว"
                            value={newChoiceName}
                            onChange={(e) => setNewChoiceName(e.target.value)}
                            required
                            style={{ flex: 2, padding: "5px 8px", fontSize: "12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                          />
                          <input
                            type="number"
                            placeholder="+฿"
                            value={newChoicePrice}
                            onChange={(e) => setNewChoicePrice(e.target.value)}
                            min="0"
                            step="1"
                            style={{ width: "55px", padding: "5px 6px", fontSize: "12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                          />
                          <button
                            type="submit"
                            disabled={addingChoice}
                            style={{
                              background: "#10b981",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              padding: "6px 10px",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            เพิ่ม
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveGroupId(null)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#64748b",
                              cursor: "pointer",
                              fontSize: "12px"
                            }}
                          >
                            ยกเลิก
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveGroupId(group.id);
                            setNewChoiceName("");
                            setNewChoicePrice("0");
                          }}
                          style={{
                            background: "white",
                            color: "#2563eb",
                            border: "1px dashed #93c5fd",
                            borderRadius: "6px",
                            padding: "5px 10px",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                            width: "100%"
                          }}
                        >
                          ＋ เพิ่มตัวเลือกในกลุ่มนี้
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  background: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                  borderRadius: "10px",
                  padding: "12px",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: "12px",
                  marginBottom: "16px"
                }}>
                  เมนูนี้ยังไม่มีกลุ่มตัวเลือก
                </div>
              )}

              {/* ฟอร์มเพิ่มกลุ่มตัวเลือกใหม่ */}
              <form
                onSubmit={handleAddOptionGroup}
                style={{
                  background: "#f1f5f9",
                  padding: "12px",
                  borderRadius: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}
              >
                <b style={{ fontSize: "13px", color: "#334155" }}>＋ สร้างกลุ่มตัวเลือกใหม่</b>
                <input
                  type="text"
                  placeholder="เช่น ระดับความเผ็ด, เพิ่มท็อปปิ้ง"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  required
                  style={{ padding: "7px 10px", fontSize: "12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
                <div style={{ display: "flex", gap: "14px", fontSize: "12px", color: "#475569" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={newGroupRequired}
                      onChange={(e) => setNewGroupRequired(e.target.checked)}
                    />
                    จำเป็นต้องเลือก
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={newGroupMultiple}
                      onChange={(e) => setNewGroupMultiple(e.target.checked)}
                    />
                    เลือกได้หลายข้อ
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={addingGroup}
                  style={{
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {addingGroup ? "กำลังสร้างกลุ่ม..." : "＋ บันทึกกลุ่มตัวเลือก"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* รายการเมนูทั้งหมดของร้านค้า */}
      <div style={{ padding: "0 12px" }}>
        {menus.length > 0 ? (
          menus.map((item) => (
            <div
              key={item.id}
              style={{
                background: "white",
                borderRadius: "14px",
                padding: "12px 14px",
                marginBottom: "10px",
                border: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                gap: "10px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "10px",
                      objectFit: "cover",
                      border: "1px solid #e2e8f0",
                      flexShrink: 0
                    }}
                  />
                ) : (
                  <div style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "10px",
                    background: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    flexShrink: 0
                  }}>
                    🍲
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: "14px", color: "#1e293b", display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {item.name}
                  </b>
                  <small style={{ color: "#64748b", display: "block", marginBottom: "2px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {item.description || "ปรุงสดใหม่ตามสั่ง"}
                  </small>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ color: "#10b981", fontSize: "14px" }}>฿{item.price}</strong>
                    {item.option_groups && item.option_groups.length > 0 && (
                      <span style={{ fontSize: "10px", color: "#6366f1", background: "#eef2ff", padding: "1px 6px", borderRadius: "4px", fontWeight: 600 }}>
                        {item.option_groups.length} กลุ่มตัวเลือก
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                <button
                  onClick={() => openEditModal(item)}
                  style={{
                    background: "#eff6ff",
                    color: "#2563eb",
                    border: "1px solid #bfdbfe",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                  title="แก้ไขเมนูและตัวเลือก"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => handleToggle(item.id, item.is_available)}
                  style={{
                    background: item.is_available ? "#ecfdf5" : "#fef2f2",
                    color: item.is_available ? "#059669" : "#dc2626",
                    border: item.is_available ? "1px solid #a7f3d0" : "1px solid #fecaca",
                    borderRadius: "8px",
                    padding: "6px 8px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  {item.is_available ? "เปิดขาย" : "หมด"}
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#dc2626",
                    cursor: "pointer",
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "6px 10px",
                    borderRadius: "8px"
                  }}
                  title="ลบเมนู"
                >
                  ลบ
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
