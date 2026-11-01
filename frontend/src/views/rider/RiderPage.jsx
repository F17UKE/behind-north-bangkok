"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { BottomNav, MobileShell, StatusPill, TopBar, EmptyState } from "../../components/AppShell";
import { statusLabel } from "../../data/mockData";
import { authApi } from "../../api/authApi";
import { riderApi } from "../../api/riderApi";
import { getSocket, playOrderChime } from "../../api/socketClient";
import RiderLogin from "./RiderLogin";

export default function RiderPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentRider, setCurrentRider] = useState(null);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("active"); // "active" | "history"
  const [statusNotice, setStatusNotice] = useState("");
  const [newJobAlert, setNewJobAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const logged = authApi.isLoggedIn("RIDER");
    setIsLoggedIn(logged);
    if (logged) {
      const riderUser = authApi.getCurrentUser("RIDER");
      setCurrentRider(riderUser);
      loadRiderOrders();
      initSocket(riderUser);
    }
  }, []);

  function initSocket(riderUser) {
    const socket = getSocket("RIDER");
    if (!socket) return;

    if (riderUser?.id) {
      socket.emit("join_dispatch_room", { rider_id: riderUser.id });
    }

    // 1. รับการแจ้งเตือนเมื่องานถูกมอบหมายให้ Rider (Real-time)
    const handleJobAssigned = (payload) => {
      console.log("🛵 [Rider Real-time] New delivery job assigned:", payload);
      playOrderChime();
      setNewJobAlert({
        orderId: payload.order_id,
        status: payload.status
      });
      loadRiderOrders();
    };

    // 2. รับการอัปเดตสถานะออเดอร์
    const handleStatusUpdate = (payload) => {
      console.log("⚡ [Rider Real-time] Order status update:", payload);
      loadRiderOrders();
    };

    socket.on("RIDER_ORDER_ASSIGNED", handleJobAssigned);
    socket.on("ORDER_STATUS_UPDATED", handleStatusUpdate);

    return () => {
      socket.off("RIDER_ORDER_ASSIGNED", handleJobAssigned);
      socket.off("ORDER_STATUS_UPDATED", handleStatusUpdate);
    };
  }

  async function loadRiderOrders() {
    setLoading(true);
    try {
      const data = await riderApi.getRiderOrders();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      console.warn("Could not load rider orders:", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId, nextStatus) {
    try {
      await riderApi.updateOrderStatus(orderId, nextStatus);
      const text = nextStatus === "IN_DELIVERY" ? "กำลังนำส่งอาหาร 🛵" : "จัดส่งอาหารสำเร็จเรียบร้อย 🎉";
      setStatusNotice(`⚡ อัปเดตออเดอร์ #${orderId}: ${text}`);
      playOrderChime();
      loadRiderOrders();
      setTimeout(() => setStatusNotice(""), 3500);
    } catch (err) {
      setStatusNotice(`⚠️ ${err?.response?.data?.message || err.message}`);
      setTimeout(() => setStatusNotice(""), 4000);
    }
  }

  function handleLogout() {
    authApi.logout("RIDER");
    setIsLoggedIn(false);
    setCurrentRider(null);
    setOrders([]);
  }

  // หากยังไม่ได้เข้าสู่ระบบ ให้แสดงหน้า Rider Login
  if (!isLoggedIn) {
    return (
      <MobileShell tone="orange">
        <RiderLogin
          onSuccess={(riderData) => {
            setCurrentRider(riderData);
            setIsLoggedIn(true);
            loadRiderOrders();
            initSocket(riderData);
          }}
        />
      </MobileShell>
    );
  }

  const activeOrders = orders.filter((o) => ["READY_FOR_DELIVERY", "IN_DELIVERY"].includes(o.status));
  const historyOrders = orders.filter((o) => o.status === "COMPLETED");

  return (
    <MobileShell tone="orange">
      <div className="merchant-page screen-enter" style={{ minHeight: "100vh", paddingBottom: "80px" }}>
        {/* ป๊อปอัปแจ้งเตือนงานใหม่ */}
        {newJobAlert && (
          <div
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "white",
              padding: "12px 16px",
              borderRadius: "14px",
              margin: "10px 12px",
              boxShadow: "0 8px 24px rgba(217, 119, 6, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              animation: "pulseAlert 0.4s ease-out"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>🛵</span>
              <div>
                <b style={{ fontSize: "14px", display: "block" }}>มีงานส่งอาหารใหม่มอบหมายให้คุณ!</b>
                <small style={{ fontSize: "12px", opacity: 0.95 }}>ออเดอร์ #{newJobAlert.orderId}</small>
              </div>
            </div>
            <button
              onClick={() => {
                setNewJobAlert(null);
                setActiveTab("active");
                loadRiderOrders();
              }}
              style={{
                background: "white",
                color: "#d97706",
                border: "none",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              รับงาน
            </button>
          </div>
        )}

        {statusNotice && (
          <div
            style={{
              background: "#2f855a",
              color: "white",
              padding: "9px 14px",
              borderRadius: "8px",
              margin: "8px 12px",
              fontSize: "13px",
              textAlign: "center"
            }}
          >
            {statusNotice}
          </div>
        )}

        {/* โปรไฟล์ไรเดอร์ */}
        <div className="merchant-profile" style={{ background: "#fff", margin: "12px", padding: "14px 16px", borderRadius: "16px", border: "1px solid #fed7aa" }}>
          <div className="avatar" style={{ background: "#ffedd5", fontSize: "24px" }}>🛵</div>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: "15px", display: "block" }}>{currentRider?.full_name || "ไรเดอร์ มจพ."}</b>
            <small style={{ color: "#78350f", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              สถานะ: ออนไลน์พร้อมรับงาน (Real-time)
            </small>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: "#fff1f2",
              color: "#e11d48",
              border: "1px solid #fecdd3",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            ออกจากระบบ
          </button>
        </div>

        {/* แถบตัวกรองงาน */}
        <div className="filter-scroll merchant-filters" style={{ margin: "0 12px 14px" }}>
          <button
            className={activeTab === "active" ? "active" : ""}
            onClick={() => setActiveTab("active")}
            style={{ flex: 1 }}
          >
            งานที่ต้องส่ง ({activeOrders.length})
          </button>
          <button
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setActiveTab("history")}
            style={{ flex: 1 }}
          >
            จัดส่งสำเร็จ ({historyOrders.length})
          </button>
        </div>

        {/* รายการออเดอร์งาน */}
        <div style={{ padding: "0 12px" }}>
          {activeTab === "active" && (
            activeOrders.length > 0 ? (
              activeOrders.map((o) => (
                <div
                  key={o.id}
                  className="merchant-order-card"
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    padding: "16px",
                    marginBottom: "14px",
                    border: "1.5px solid #fed7aa",
                    boxShadow: "0 4px 16px rgba(251, 146, 60, 0.08)"
                  }}
                >
                  <div className="order-head" style={{ marginBottom: "12px" }}>
                    <div>
                      <b style={{ fontSize: "16px", color: "#c2410c" }}>{o.order_code || `#ORD${String(o.id).padStart(3, "0")}`}</b>
                      <small style={{ display: "block", color: "#64748b" }}>
                        ค่าจัดส่ง: <b>฿{o.delivery_fee || 10}</b>
                      </small>
                    </div>
                    <StatusPill tone={o.status === "READY_FOR_DELIVERY" ? "yellow" : "orange"}>
                      {statusLabel[o.status] || o.status}
                    </StatusPill>
                  </div>

                  {/* แผนที่จุดรับ และจุดส่ง */}
                  <div style={{ background: "#fff7ed", padding: "12px", borderRadius: "12px", marginBottom: "14px", fontSize: "13px" }}>
                    <div style={{ marginBottom: "8px", display: "flex", gap: "8px" }}>
                      <span style={{ fontSize: "16px" }}>🏬</span>
                      <div>
                        <strong style={{ color: "#9a3412" }}>จุดรับอาหาร: {o.store_name}</strong>
                        <div style={{ color: "#64748b", fontSize: "12px" }}>{o.merchant_location || "หลัง มจพ."}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <span style={{ fontSize: "16px" }}>📍</span>
                      <div>
                        <strong style={{ color: "#ea580c" }}>จุดส่งอาหาร: {o.dormitory_name}</strong>
                        <div style={{ color: "#1e293b", fontWeight: 600 }}>{o.delivery_room_number || "หน้าหอพัก"}</div>
                        <div style={{ color: "#64748b", fontSize: "12px" }}>
                          ผู้สั่งซื้อ: {o.customer_name} · โทร: <b>{o.customer_phone || "081-234-5678"}</b>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ปุ่มเปลี่ยนสถานะ */}
                  <div>
                    {o.status === "READY_FOR_DELIVERY" && (
                      <button
                        onClick={() => updateStatus(o.id, "IN_DELIVERY")}
                        style={{
                          width: "100%",
                          background: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
                          color: "white",
                          border: "none",
                          borderRadius: "12px",
                          padding: "12px",
                          fontSize: "14px",
                          fontWeight: 700,
                          cursor: "pointer",
                          boxShadow: "0 4px 12px rgba(234, 88, 12, 0.25)"
                        }}
                      >
                        🛵 ออกเดินทางไปส่งอาหาร (Start Delivery)
                      </button>
                    )}

                    {o.status === "IN_DELIVERY" && (
                      <button
                        onClick={() => updateStatus(o.id, "COMPLETED")}
                        style={{
                          width: "100%",
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          color: "white",
                          border: "none",
                          borderRadius: "12px",
                          padding: "12px",
                          fontSize: "14px",
                          fontWeight: 700,
                          cursor: "pointer",
                          boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)"
                        }}
                      >
                        ✅ นำส่งอาหารถึงมือลูกค้าเรียบร้อย (Complete)
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="ยังไม่มีงานจัดส่งขณะนี้"
                text="เมื่อร้านค้าทำอาหารเสร็จและมอบหมายงานให้คุณ รายการงานจะเด้งขึ้นที่นี่อัตโนมัติแบบ Real-time"
              />
            )
          )}

          {activeTab === "history" && (
            historyOrders.length > 0 ? (
              historyOrders.map((o) => (
                <div
                  key={o.id}
                  className="merchant-order-card compact"
                  style={{
                    background: "#ffffff",
                    borderRadius: "14px",
                    padding: "14px",
                    marginBottom: "10px",
                    border: "1px solid #e2e8f0"
                  }}
                >
                  <div className="order-head">
                    <div>
                      <b>{o.order_code || `#ORD${o.id}`}</b>
                      <small>{o.dormitory_name} · {o.delivery_room_number}</small>
                    </div>
                    <StatusPill tone="green">จัดส่งสำเร็จ</StatusPill>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="ยังไม่มีประวัติงาน" text="งานที่คุณจัดส่งสำเร็จแล้วจะแสดงในแท็บนี้" />
            )
          )}
        </div>
      </div>

      <BottomNav
        tone="orange"
        active="delivery"
        onChange={(key) => {
          if (key === "home") window.location.href = "/";
        }}
        items={[
          { key: "home", label: "หน้าแรก", icon: "⌂" },
          { key: "delivery", label: `งานส่ง (${activeOrders.length})`, icon: "🛵" }
        ]}
      />
    </MobileShell>
  );
}
