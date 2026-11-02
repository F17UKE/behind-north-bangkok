"use client";

import { useEffect, useState, useMemo } from "react";
import { orderApi } from "../../api/orderApi";
import { getSocket, playOrderChime } from "../../api/socketClient";
import { authApi } from "../../api/authApi";

export default function MerchantKDS({ onBack, isStandalone = false }) {
  const [kitchenOrders, setKitchenOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filterMode, setFilterMode] = useState("all"); // "all" | "urgent"

  // นาฬิกาแบบ Real-time บนหัวจอครัว
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // โหลดรายการออเดอร์ในครัว
  async function loadKitchenOrders() {
    try {
      const res = await orderApi.getKitchenOrders();
      if (Array.isArray(res)) {
        // เรียงลำดับ มาก่อนอยู่บน (FIFO: created_at ASC / id ASC)
        const sorted = [...res].sort((a, b) => {
          const tA = new Date(a.created_at || 0).getTime() || Number(a.id);
          const tB = new Date(b.created_at || 0).getTime() || Number(b.id);
          return tA - tB;
        });
        setKitchenOrders(sorted);
      }
    } catch (err) {
      console.warn("Could not fetch kitchen orders:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKitchenOrders();

    const merchant = authApi.getCurrentUser("MERCHANT");
    const socket = getSocket("MERCHANT");

    if (socket && merchant?.id) {
      socket.emit("join_merchant_kds", { merchant_id: merchant.id });
      socket.emit("join_merchant_room", { merchant_id: merchant.id });

      const handleRefresh = (payload) => {
        console.log("🍳 [KDS Socket] Event received:", payload);
        if (soundEnabled) playOrderChime();
        loadKitchenOrders();
      };

      socket.on("NEW_ORDER_RECEIVED", handleRefresh);
      socket.on("ORDER_STATUS_UPDATED", handleRefresh);
      socket.on("KDS_ITEM_COMPLETED", handleRefresh);
      socket.on("KDS_ORDER_COMPLETED", handleRefresh);

      return () => {
        socket.off("NEW_ORDER_RECEIVED", handleRefresh);
        socket.off("ORDER_STATUS_UPDATED", handleRefresh);
        socket.off("KDS_ITEM_COMPLETED", handleRefresh);
        socket.off("KDS_ORDER_COMPLETED", handleRefresh);
      };
    }
  }, [soundEnabled]);

  // Polling fallback ทุก 4 วินาที สำหรับหน้าจอในครัว
  useEffect(() => {
    const interval = setInterval(loadKitchenOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  // ติ๊กรายการอาหารเสร็จรายจาน (Item-level)
  async function handleToggleItem(orderId, itemId, currentStatus) {
    if (currentStatus) return; // ถ้าเสร็จแล้วไม่ต้องกดซ้ำ
    try {
      // Optimistic UI update
      setKitchenOrders(prev => prev.map(ord => {
        if (ord.id === orderId) {
          const updatedItems = ord.items.map(it => it.id === itemId ? { ...it, is_completed: true } : it);
          return { ...ord, items: updatedItems };
        }
        return ord;
      }));

      await orderApi.completeKitchenItem(orderId, itemId);
      if (soundEnabled) playOrderChime();
      loadKitchenOrders();
    } catch (err) {
      console.error("Failed to complete kitchen item:", err);
      loadKitchenOrders();
    }
  }

  // กดเสร็จสิ้นทุกรายการทั้งออเดอร์ (Order-level)
  async function handleCompleteOrder(orderId) {
    try {
      // Optimistic remove
      setKitchenOrders(prev => prev.filter(o => o.id !== orderId));
      await orderApi.completeEntireOrder(orderId);
      if (soundEnabled) playOrderChime();
      loadKitchenOrders();
    } catch (err) {
      console.error("Failed to complete entire order:", err);
      loadKitchenOrders();
    }
  }

  // คำนวณเวลาที่ผ่านไป (นาที)
  function getElapsedMinutes(createdAt) {
    if (!createdAt) return 0;
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(diff / 60000));
  }

  const displayedOrders = useMemo(() => {
    if (filterMode === "urgent") {
      return kitchenOrders.filter(o => getElapsedMinutes(o.created_at) >= 15);
    }
    return kitchenOrders;
  }, [kitchenOrders, filterMode]);

  return (
    <div style={{
      minHeight: isStandalone ? "100vh" : "calc(100vh - 120px)",
      background: "#0f172a",
      color: "#f8fafc",
      padding: isStandalone ? "20px" : "12px",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      {/* Top Header Bar */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        background: "#1e293b",
        borderRadius: "14px",
        marginBottom: "16px",
        border: "1px solid #334155",
        gap: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {onBack && (
            <button
              onClick={onBack}
              style={{
                background: "#334155",
                color: "#f8fafc",
                border: "none",
                borderRadius: "8px",
                padding: "6px 12px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "13px"
              }}
            >
              ← กลับ
            </button>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
              🍳 จอครัว KDS <span style={{ fontSize: "12px", background: "#f97316", color: "white", padding: "2px 8px", borderRadius: "10px" }}>Kitchen Display</span>
            </h1>
            <small style={{ color: "#94a3b8" }}>คิวออเดอร์ที่ต้องปรุง (มาก่อนอยู่บน FIFO)</small>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: "#0f172a", border: "1px solid #334155", padding: "4px 12px", borderRadius: "8px", fontSize: "14px", fontWeight: 700, color: "#38bdf8", letterSpacing: "1px" }}>
            ⏰ {currentTime || "--:--:--"}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              background: soundEnabled ? "#065f46" : "#475569",
              color: "#f8fafc",
              border: "none",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            {soundEnabled ? "🔔 เสียงเตือน: เปิด" : "🔕 เสียงเตือน: ปิด"}
          </button>

          {!isStandalone && (
            <a
              href="/merchant/kds"
              target="_blank"
              rel="noreferrer"
              style={{
                background: "#2563eb",
                color: "white",
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                display: "inline-block"
              }}
            >
              🖥️ เปิดจอเต็ม (Full Screen) ↗
            </a>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <button
          onClick={() => setFilterMode("all")}
          style={{
            flex: 1,
            minWidth: "140px",
            background: filterMode === "all" ? "#f97316" : "#1e293b",
            color: "white",
            border: filterMode === "all" ? "1px solid #fdba74" : "1px solid #334155",
            borderRadius: "10px",
            padding: "10px",
            textAlign: "left",
            cursor: "pointer"
          }}
        >
          <div style={{ fontSize: "11px", opacity: 0.85 }}>ออเดอร์ทั้งหมดในครัว</div>
          <b style={{ fontSize: "20px" }}>{kitchenOrders.length} คิว</b>
        </button>

        <button
          onClick={() => setFilterMode(filterMode === "urgent" ? "all" : "urgent")}
          style={{
            flex: 1,
            minWidth: "140px",
            background: filterMode === "urgent" ? "#dc2626" : "#1e293b",
            color: "white",
            border: filterMode === "urgent" ? "1px solid #fca5a5" : "1px solid #334155",
            borderRadius: "10px",
            padding: "10px",
            textAlign: "left",
            cursor: "pointer"
          }}
        >
          <div style={{ fontSize: "11px", opacity: 0.85 }}>รอนานเกิน 15 นาที</div>
          <b style={{ fontSize: "20px", color: kitchenOrders.filter(o => getElapsedMinutes(o.created_at) >= 15).length > 0 ? "#f87171" : "white" }}>
            {kitchenOrders.filter(o => getElapsedMinutes(o.created_at) >= 15).length} คิว
          </b>
        </button>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>⏳</div>
          <b>กำลังโหลดคิวครัว KDS...</b>
        </div>
      ) : displayedOrders.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "#1e293b",
          borderRadius: "16px",
          border: "1px dashed #475569"
        }}>
          <div style={{ fontSize: "44px", marginBottom: "12px" }}>🍳</div>
          <h2 style={{ fontSize: "18px", margin: "0 0 6px", color: "#e2e8f0" }}>
            {filterMode === "urgent" ? "ไม่มีออเดอร์ที่รอนานเกิน 15 นาที" : "ไม่มีออเดอร์รอปรุงในครัวขณะนี้"}
          </h2>
          <p style={{ fontSize: "13px", color: "#94a3b8", maxWidth: "380px", margin: "0 auto" }}>
            เมื่อลูกค้าชำระเงินและอัปโหลดสลิปแล้ว ออเดอร์จะเด้งเข้ามาในหน้าจอนี้โดยอัตโนมัติแบบ Real-time ทันที
          </p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
          gap: "14px",
          alignItems: "start"
        }}>
          {displayedOrders.map((ord, idx) => {
            const elapsed = getElapsedMinutes(ord.created_at);
            const isLate = elapsed >= 15;
            const items = ord.items || [];
            const completedCount = items.filter(it => it.is_completed).length;
            const allItemsDone = items.length > 0 && completedCount === items.length;
            const orderCode = ord.order_code 
              ? (ord.order_code.startsWith("#") ? ord.order_code : `#${ord.order_code}`)
              : `#ORD${String(ord.id).padStart(3, "0")}`;

            return (
              <div
                key={ord.id}
                style={{
                  background: "#1e293b",
                  borderRadius: "14px",
                  border: isLate ? "2px solid #ef4444" : "1px solid #334155",
                  overflow: "hidden",
                  boxShadow: isLate 
                    ? "0 4px 20px rgba(239, 68, 68, 0.25)" 
                    : "0 4px 12px rgba(0, 0, 0, 0.25)",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                {/* Order Header */}
                <div style={{
                  padding: "12px 14px",
                  background: isLate ? "linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)" : "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
                  borderBottom: "1px solid #475569",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{
                        background: "#f97316",
                        color: "white",
                        fontSize: "13px",
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: "6px",
                        letterSpacing: "0.5px"
                      }}>
                        {orderCode}
                      </span>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>คิวที่ {idx + 1}</span>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc", marginTop: "4px" }}>
                      คุณ {ord.customer_name || "นักศึกษา"}
                    </div>
                  </div>

                  {/* Timer Badge */}
                  <div style={{
                    textAlign: "right",
                    background: isLate ? "#dc2626" : "#0f172a",
                    border: isLate ? "1px solid #fca5a5" : "1px solid #475569",
                    padding: "4px 8px",
                    borderRadius: "8px"
                  }}>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: isLate ? "white" : "#fbbf24" }}>
                      ⏱️ {elapsed} นาที
                    </div>
                    <div style={{ fontSize: "10px", color: "#cbd5e1" }}>
                      {ord.created_at ? new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "ตอนนี้"}
                    </div>
                  </div>
                </div>

                {/* Delivery Target info */}
                <div style={{ padding: "8px 14px", background: "rgba(15, 23, 42, 0.4)", borderBottom: "1px solid #334155", fontSize: "12px", color: "#cbd5e1" }}>
                  📍 {ord.dormitory_name ? `${ord.dormitory_name} ` : ""}{ord.delivery_room_number || "จัดส่งหอพัก"}
                </div>

                {/* Items List */}
                <div style={{ padding: "12px 14px", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", fontSize: "11.5px", color: "#94a3b8" }}>
                    <span>รายการอาหาร ({items.length} รายการ)</span>
                    <span style={{ color: allItemsDone ? "#4ade80" : "#fbbf24", fontWeight: 700 }}>
                      เสร็จ {completedCount}/{items.length} จาน
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {items.map((it) => {
                      const isDone = it.is_completed;
                      return (
                        <div
                          key={it.id}
                          onClick={() => handleToggleItem(ord.id, it.id, isDone)}
                          style={{
                            background: isDone ? "rgba(16, 185, 129, 0.12)" : "#0f172a",
                            border: isDone ? "1px solid #059669" : "1px solid #334155",
                            borderRadius: "10px",
                            padding: "10px",
                            cursor: isDone ? "default" : "pointer",
                            transition: "all 0.15s ease",
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: "8px"
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              color: isDone ? "#94a3b8" : "#ffffff",
                              textDecoration: isDone ? "line-through" : "none"
                            }}>
                              {it.menu_name || "อาหาร"} <span style={{ color: isDone ? "#64748b" : "#f97316" }}>x{it.quantity || 1}</span>
                            </div>

                            {/* Choices / Modifiers */}
                            {Array.isArray(it.choices) && it.choices.length > 0 && (
                              <div style={{ marginTop: "4px", fontSize: "12px", color: isDone ? "#64748b" : "#38bdf8" }}>
                                ↳ {it.choices.map(c => typeof c === "object" ? c.name : c).join(", ")}
                              </div>
                            )}

                            {/* Cooking Note */}
                            {it.note && (
                              <div style={{
                                marginTop: "4px",
                                background: "rgba(234, 179, 8, 0.15)",
                                border: "1px solid #ca8a04",
                                color: "#fef08a",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: 600
                              }}>
                                📌 หมายเหตุ: {it.note}
                              </div>
                            )}
                          </div>

                          {/* Checkbox button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleItem(ord.id, it.id, isDone);
                            }}
                            style={{
                              background: isDone ? "#10b981" : "#334155",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              padding: "4px 8px",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: isDone ? "default" : "pointer",
                              flexShrink: 0
                            }}
                          >
                            {isDone ? "✓ เสร็จแล้ว" : "ปรุงเสร็จ"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Action */}
                <div style={{ padding: "10px 14px", background: "#0f172a", borderTop: "1px solid #334155" }}>
                  <button
                    onClick={() => handleCompleteOrder(ord.id)}
                    style={{
                      width: "100%",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      padding: "10px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    ✓ เสร็จสิ้นทุกรายการ (พร้อมจัดส่ง)
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
