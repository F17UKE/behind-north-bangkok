"use client";

import { useEffect, useMemo, useState } from "react";
import { BottomNav, MobileShell, SearchBar, StatusPill, TopBar, EmptyState } from "../../components/AppShell";
import { adminUsers, statusLabel } from "../../data/mockData";
import { adminApi } from "../../api/adminApi";
import { authApi } from "../../api/authApi";

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [screen, setScreen] = useState("home");
  const [users, setUsers] = useState(adminUsers);
  const [selectedUser, setSelectedUser] = useState(adminUsers[0]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [actionNotice, setActionNotice] = useState("");
  const [menusModalOpen, setMenusModalOpen] = useState(false);
  const [merchantMenus, setMerchantMenus] = useState([]);
  const [loadingMenus, setLoadingMenus] = useState(false);

  useEffect(() => {
    const logged = authApi.isLoggedIn("ADMIN");
    setIsLoggedIn(logged);
    if (logged) {
      initAdminData();
    }
  }, []);

  async function initAdminData() {
    try {
      // 1. ดึงร้านค้าทั้งหมด
      const merchants = await adminApi.getAllMerchants();
      let mappedMerchants = [];
      if (Array.isArray(merchants) && merchants.length > 0) {
        mappedMerchants = merchants.map(m => ({
          id: `m_${m.id}`,
          rawId: m.id,
          name: m.store_name,
          phone: m.promptpay_id || "08X-XXX-XXXX",
          role: "Merchant",
          status: m.is_suspended ? "blocked" : (m.is_approved ? "active" : "pending_approval"),
          location: m.location || "โซนหลังมอ",
          isOpen: m.is_open,
          isSuspended: !!m.is_suspended
        }));
      }

      // 2. ดึงลูกค้าทั้งหมด
      const customersRes = await adminApi.getAllCustomers();
      const customersList = customersRes?.data || (Array.isArray(customersRes) ? customersRes : []);
      let mappedCustomers = [];
      if (Array.isArray(customersList) && customersList.length > 0) {
        mappedCustomers = customersList.map(c => ({
          id: `c_${c.id}`,
          rawId: c.id,
          name: c.username,
          phone: c.phone || "ยังไม่ระบุเบอร์",
          role: "User",
          status: c.is_suspended ? "blocked" : "active",
          location: c.dormitory_name ? `${c.dormitory_name} ห้อง ${c.room_number || '-'}` : "ยังไม่ระบุหอพัก",
          isSuspended: !!c.is_suspended
        }));
      }

      const combined = [...mappedCustomers, ...mappedMerchants];
      if (combined.length > 0) {
        setUsers(combined);
        if (!selectedUser || !combined.find(u => u.id === selectedUser.id)) {
          setSelectedUser(combined[0]);
        }
      }
    } catch (err) {
      console.log("Could not load backend admin data:", err.message);
    }
  }

  const filtered = useMemo(() => users.filter((u) => {
    const q = `${u.name} ${u.phone} ${u.role}`.toLowerCase();
    if (!q.includes(query.toLowerCase())) return false;
    if (tab === "user") return u.role === "User";
    if (tab === "merchant") return u.role === "Merchant";
    if (tab === "pending") return u.status === "pending_approval";
    if (tab === "suspended") return u.status === "blocked" || u.isSuspended;
    return true;
  }), [users, query, tab]);

  // สลับสถานะ อนุมัติ / ระงับ / ยกเลิกการระงับ
  async function toggleSuspension(targetUser) {
    const isCurrentlySuspended = targetUser.status === "blocked" || targetUser.isSuspended;
    const nextSuspendedState = !isCurrentlySuspended;

    try {
      if (targetUser.role === "Merchant") {
        await adminApi.toggleMerchantSuspension(targetUser.rawId, nextSuspendedState);
      } else {
        await adminApi.toggleCustomerSuspension(targetUser.rawId, nextSuspendedState);
      }

      const nextStatus = nextSuspendedState ? "blocked" : "active";
      setActionNotice(
        nextSuspendedState 
          ? `🚫 ระงับการใช้งาน "${targetUser.name}" เรียบร้อยแล้ว`
          : `✅ ยกเลิกการระงับ "${targetUser.name}" เปิดใช้งานตามปกติ`
      );

      setUsers(all => all.map(u => u.id === targetUser.id ? { ...u, status: nextStatus, isSuspended: nextSuspendedState } : u));
      setSelectedUser(prev => ({ ...prev, status: nextStatus, isSuspended: nextSuspendedState }));
    } catch (err) {
      setActionNotice(`⚠️ เกิดข้อผิดพลาด: ${err.message}`);
    }
    setTimeout(() => setActionNotice(""), 3500);
  }

  async function changeStatus(status) {
    if (selectedUser.role === "Merchant" && selectedUser.rawId) {
      try {
        if (status === "active") {
          await adminApi.approveMerchant(selectedUser.rawId);
          setActionNotice(`✅ อนุมัติร้านค้า "${selectedUser.name}" เรียบร้อยแล้ว`);
        } else if (status === "blocked") {
          await adminApi.rejectMerchant(selectedUser.rawId);
          setActionNotice(`🚫 ระงับร้านค้า "${selectedUser.name}" เรียบร้อยแล้ว`);
        }
      } catch (err) {
        setActionNotice(`บันทึกสถานะ: ${status}`);
      }
      setTimeout(() => setActionNotice(""), 3500);
    }

    setUsers((all) => all.map((u) => u.id === selectedUser.id ? { ...u, status } : u)); 
    setSelectedUser((u) => ({ ...u, status })); 
  }

  // ดึงรายการอาหารของร้านค้า
  async function handleViewMenus(merchantId) {
    setLoadingMenus(true);
    setMenusModalOpen(true);
    try {
      const res = await adminApi.getMerchantMenus(merchantId);
      const list = res?.data || (Array.isArray(res) ? res : []);
      setMerchantMenus(list);
    } catch (err) {
      console.error("Failed to load merchant menus:", err);
      setMerchantMenus([]);
    } finally {
      setLoadingMenus(false);
    }
  }

  function handleLogout() {
    authApi.logout("ADMIN");
    setIsLoggedIn(false);
    setUsers([]);
  }

  // หากยังไม่ได้เข้าสู่ระบบ ให้แสดงหน้า Admin Login
  if (!isLoggedIn) {
    return (
      <MobileShell tone="admin">
        <AdminLogin
          onSuccess={() => {
            setIsLoggedIn(true);
            initAdminData();
          }}
        />
      </MobileShell>
    );
  }

  return (
    <MobileShell tone="admin">
      <div key={screen} className="admin-page screen-enter" style={{ minHeight: "100vh", paddingBottom: "80px" }}>
        {actionNotice && (
          <div style={{
            background: actionNotice.includes("🚫") ? "#dc2626" : "#16a34a",
            color: "white",
            padding: "10px 14px",
            borderRadius: "10px",
            margin: "10px 12px",
            fontSize: "13px",
            textAlign: "center",
            fontWeight: 700,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
          }}>
            {actionNotice}
          </div>
        )}

        {screen === "home" && (
          <AdminHome 
            go={setScreen} 
            users={users} 
            onLogout={handleLogout} 
          />
        )}
        {screen === "users" && (
          <AdminUsers 
            users={filtered} 
            allUsers={users}
            query={query} 
            setQuery={setQuery} 
            tab={tab} 
            setTab={setTab} 
            onBack={() => setScreen("home")} 
            onOpen={(u) => { setSelectedUser(u); setScreen("detail"); }} 
          />
        )}
        {screen === "detail" && (
          <AdminDetail 
            user={selectedUser} 
            onBack={() => setScreen("users")} 
            onChangeStatus={changeStatus}
            onToggleSuspension={() => toggleSuspension(selectedUser)}
            onViewMenus={() => handleViewMenus(selectedUser.rawId)}
          />
        )}
        {screen === "more" && <AdminMore onBack={() => setScreen("home")} onLogout={handleLogout} />}
        {screen === "notice" && <AdminNotice onBack={() => setScreen("home")} />}

        {/* Modal ดูรายการอาหารของร้านค้า */}
        {menusModalOpen && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}>
            <div style={{
              background: "white",
              borderRadius: "18px",
              width: "100%",
              maxWidth: "440px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
              overflow: "hidden"
            }}>
              <div style={{
                padding: "14px 18px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc"
              }}>
                <div>
                  <b style={{ fontSize: "16px", color: "#0f172a" }}>🍽️ รายการอาหารของร้าน</b>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>{selectedUser.name} ({merchantMenus.length} รายการ)</div>
                </div>
                <button
                  onClick={() => setMenusModalOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "20px",
                    cursor: "pointer",
                    color: "#64748b"
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: "14px 18px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                {loadingMenus ? (
                  <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>⏳ กำลังโหลดเมนูอาหาร...</div>
                ) : merchantMenus.length === 0 ? (
                  <EmptyState title="ยังไม่มีเมนูอาหาร" text="ร้านค้านี้ยังไม่ได้เพิ่มรายการอาหารในระบบ" />
                ) : (
                  merchantMenus.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px",
                        background: "#f8fafc",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0"
                      }}
                    >
                      <div style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "10px",
                        background: "#fff",
                        border: "1px solid #cbd5e1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        flexShrink: 0
                      }}>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <span style={{ fontSize: "22px" }}>🍲</span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <b style={{ fontSize: "14px", color: "#0f172a" }}>{item.name}</b>
                          <b style={{ fontSize: "14px", color: "#ea580c" }}>฿{item.price}</b>
                        </div>
                        {item.category && (
                          <span style={{ fontSize: "11px", background: "#e2e8f0", padding: "2px 6px", borderRadius: "4px", color: "#475569" }}>
                            {item.category}
                          </span>
                        )}
                        <div style={{ fontSize: "11px", color: item.is_available ? "#16a34a" : "#dc2626", marginTop: "3px" }}>
                          {item.is_available ? "● พร้อมจำหน่าย" : "○ สินค้าหมด" }
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ padding: "12px 18px", borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
                <button
                  onClick={() => setMenusModalOpen(false)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#334155",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        )}

        <BottomNav 
          tone="admin" 
          active={screen} 
          onChange={(key) => setScreen(key)} 
          items={[
            { key: "home", label: "Dashboard", icon: "⌂" },
            { key: "users", label: "ผู้ใช้งาน", icon: "👥" },
            { key: "notice", label: "แจ้งเตือน", icon: "🔔" },
            { key: "more", label: "ตั้งค่า", icon: "⚙️" }
          ]} 
        />
      </div>
    </MobileShell>
  );
}

/**
 * หน้าจอ Login แอดมิน (Username: admin, Password: admin1234)
 */
function AdminLogin({ onSuccess }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await authApi.loginAdmin(username.trim(), password.trim());
      onSuccess();
    } catch (err) {
      setError(err.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: "24px 20px",
      background: "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)"
    }}>
      <div style={{
        background: "white",
        borderRadius: "20px",
        padding: "28px 22px",
        boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)",
        border: "1px solid #e2e8f0"
      }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            color: "white",
            fontSize: "30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
            boxShadow: "0 6px 16px rgba(15, 23, 42, 0.25)"
          }}>
            🛡️
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
            เข้าสู่ระบบผู้ดูแลระบบ
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Behind NB Central Administration
          </p>
        </div>

        {error && (
          <div style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            color: "#b91c1c",
            padding: "10px 14px",
            borderRadius: "10px",
            fontSize: "13px",
            marginBottom: "16px",
            textAlign: "center",
            fontWeight: 600
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
              ชื่อผู้ใช้งาน (Username)
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1.5px solid #cbd5e1",
                fontSize: "14px",
                color: "#0f172a",
                background: "#f8fafc",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
              รหัสผ่าน (Password)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin1234"
              required
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1.5px solid #cbd5e1",
                fontSize: "14px",
                color: "#0f172a",
                background: "#f8fafc",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div
            onClick={() => {
              setUsername("admin");
              setPassword("admin1234");
            }}
            style={{
              padding: "8px 12px",
              background: "#f1f5f9",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#475569",
              cursor: "pointer",
              textAlign: "center",
              border: "1px dashed #cbd5e1"
            }}
          >
            💡 บัญชีเริ่มต้น: <b>admin</b> / <b>admin1234</b> (แตะเพื่อเติมอัตโนมัติ)
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
              color: "white",
              padding: "13px",
              borderRadius: "12px",
              border: "none",
              fontSize: "15px",
              fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "8px",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.25)"
            }}
          >
            {loading ? "กำลังตรวจสอบสิทธิ์..." : "เข้าสู่ระบบแอดมิน ➔"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminHome({ go, users, onLogout }) {
  const customerCount = users.filter(u => u.role === "User").length;
  const merchantCount = users.filter(u => u.role === "Merchant").length;
  const pendingCount = users.filter(u => u.status === "pending_approval").length;

  return (
    <>
      <div className="admin-header" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 16px",
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        color: "white",
        borderRadius: "0 0 18px 18px",
        marginBottom: "14px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px"
          }}>
            🛡️
          </div>
          <div>
            <b style={{ fontSize: "15px", display: "block" }}>แอดมินระบบส่วนกลาง</b>
            <small style={{ fontSize: "11.5px", opacity: 0.85 }}>Super Admin (admin)</small>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          ออกจากระบบ
        </button>
      </div>

      <div className="admin-stats" style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
        padding: "0 14px 14px"
      }}>
        <div style={{ background: "white", padding: "14px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <b style={{ fontSize: "22px", color: "#0f172a", display: "block" }}>{users.length}</b>
          <small style={{ color: "#64748b", fontSize: "12px" }}>ผู้ใช้งานทั้งหมด</small>
        </div>
        <div style={{ background: "white", padding: "14px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <b style={{ fontSize: "22px", color: "#ea580c", display: "block" }}>{merchantCount}</b>
          <small style={{ color: "#64748b", fontSize: "12px" }}>ร้านค้าในระบบ</small>
        </div>
        <div style={{ background: "white", padding: "14px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <b style={{ fontSize: "22px", color: "#0284c7", display: "block" }}>{customerCount}</b>
          <small style={{ color: "#64748b", fontSize: "12px" }}>ลูกค้า/นักศึกษา</small>
        </div>
        <div style={{ background: "white", padding: "14px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <b style={{ fontSize: "22px", color: pendingCount > 0 ? "#d97706" : "#16a34a", display: "block" }}>{pendingCount}</b>
          <small style={{ color: "#64748b", fontSize: "12px" }}>ร้านค้ารออนุมัติ</small>
        </div>
      </div>

      <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <button 
          className="admin-action-card" 
          onClick={() => go("users")}
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "14px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            cursor: "pointer",
            textAlign: "left",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
          }}
        >
          <span style={{ fontSize: "26px" }}>👥</span>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: "14.5px", color: "#0f172a", display: "block" }}>จัดการผู้ใช้งาน & ร้านค้า</b>
            <small style={{ fontSize: "12px", color: "#64748b" }}>ตรวจสอบร้านค้า, ดูรายการอาหาร, อนุมัติ และระงับบัญชี</small>
          </div>
          <strong style={{ fontSize: "20px", color: "#cbd5e1" }}>›</strong>
        </button>

        <button 
          className="admin-action-card" 
          onClick={() => go("notice")}
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "14px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            cursor: "pointer",
            textAlign: "left",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
          }}
        >
          <span style={{ fontSize: "26px" }}>🔔</span>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: "14.5px", color: "#0f172a", display: "block" }}>สถานะระบบ & การเชื่อมต่อ</b>
            <small style={{ fontSize: "12px", color: "#64748b" }}>Backend API, Database และ Socket Health</small>
          </div>
          <strong style={{ fontSize: "20px", color: "#cbd5e1" }}>›</strong>
        </button>
      </div>
    </>
  );
}

function AdminUsers({ users, allUsers = [], query, setQuery, tab, setTab, onBack, onOpen }) { 
  const counts = {
    all: allUsers.length,
    user: allUsers.filter(u => u.role === "User").length,
    merchant: allUsers.filter(u => u.role === "Merchant").length,
    pending: allUsers.filter(u => u.status === "pending_approval").length,
    suspended: allUsers.filter(u => u.status === "blocked" || u.isSuspended).length
  };

  return (
    <>
      <TopBar title="จัดการผู้ใช้งาน" subtitle="Users & Merchants Management" onBack={onBack} />
      <SearchBar value={query} onChange={setQuery} placeholder="ค้นหาชื่อ, เบอร์โทร, หรือประเภทร้าน..." />
      <div className="filter-scroll">
        <button className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>ทั้งหมด ({counts.all})</button>
        <button className={tab === "user" ? "active" : ""} onClick={() => setTab("user")}>ลูกค้า ({counts.user})</button>
        <button className={tab === "merchant" ? "active" : ""} onClick={() => setTab("merchant")}>ร้านค้า ({counts.merchant})</button>
        <button className={tab === "pending" ? "active" : ""} onClick={() => setTab("pending")}>รออนุมัติ ({counts.pending})</button>
        <button className={tab === "suspended" ? "active" : ""} onClick={() => setTab("suspended")}>ถูกระงับ ({counts.suspended})</button>
      </div>

      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {users.length ? users.map((u) => {
          const isSuspended = u.status === "blocked" || u.isSuspended;
          return (
            <button 
              className="admin-user-row" 
              key={u.id} 
              onClick={() => onOpen(u)}
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                textAlign: "left",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
              }}
            >
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: u.role === "Merchant" ? "#ffedd5" : "#e0f2fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0
              }}>
                {u.role === "Merchant" ? "🏪" : "👤"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: "14px", color: "#0f172a", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {u.name}
                </b>
                <small style={{ color: "#64748b", fontSize: "12px" }}>{u.phone} · {u.role === "Merchant" ? "ร้านค้า" : "ลูกค้า"}</small>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ 
                  fontSize: "11px",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontWeight: 700,
                  background: isSuspended ? "#fee2e2" : u.status === "active" ? "#dcfce7" : "#fef3c7",
                  color: isSuspended ? "#b91c1c" : u.status === "active" ? "#15803d" : "#b45309"
                }}>
                  {isSuspended ? "🚫 ถูกระงับ" : u.status === "active" ? "เปิดใช้งาน" : "⏳ รออนุมัติ"}
                </span>
              </div>
            </button>
          );
        }) : <EmptyState title="ไม่พบข้อมูล" text="ไม่พบผู้ใช้งานหรือร้านค้าตามตัวกรองที่เลือก" />}
      </div>
    </>
  ); 
}

function AdminDetail({ user, onBack, onChangeStatus, onToggleSuspension, onViewMenus }) { 
  const isSuspended = user.status === "blocked" || user.isSuspended;

  return (
    <>
      <TopBar title="รายละเอียดบัญชี" subtitle={`${user.role} Detail`} onBack={onBack} />
      <div style={{ padding: "16px" }}>
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "18px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          marginBottom: "14px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: user.role === "Merchant" ? "#ffedd5" : "#e0f2fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px"
            }}>
              {user.role === "Merchant" ? "🏪" : "👤"}
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>{user.name}</h2>
              <span style={{
                fontSize: "12px",
                fontWeight: 700,
                color: isSuspended ? "#dc2626" : user.status === "active" ? "#16a34a" : "#d97706"
              }}>
                ● {isSuspended ? "ถูกระงับการใช้งานชั่วคราว" : user.status === "active" ? "เปิดใช้งานตามปกติ (Active)" : "รอการอนุมัติ (Pending Approval)"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#334155", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
            <div>☎ เบอร์โทร / พร้อมเพย์: <b>{user.phone}</b></div>
            <div>✉ ประเภทบัญชี: <b>{user.role === "Merchant" ? "ร้านค้า (Merchant)" : "ลูกค้า (Customer)"}</b></div>
            <div>📍 พิกัด / หอพัก: <b>{user.location || "โซนหลังมอ มจพ."}</b></div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* เมนูสำหรับร้านค้า: ดูรายการอาหาร */}
          {user.role === "Merchant" && (
            <button
              onClick={onViewMenus}
              style={{
                width: "100%",
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "13px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)"
              }}
            >
              <span>🍽️ ตรวจสอบรายการอาหารของร้านค้า (View Menus)</span>
            </button>
          )}

          {/* ปุ่มอนุมัติสำหรับร้านที่รอการอนุมัติ */}
          {user.role === "Merchant" && user.status === "pending_approval" && (
            <button
              onClick={() => onChangeStatus("active")}
              style={{
                width: "100%",
                background: "#059669",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "13px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)"
              }}
            >
              ✅ อนุมัติร้านค้าเปิดให้บริการทันที
            </button>
          )}

          {/* ปุ่มระงับ / ยกเลิกการระงับบัญชี */}
          <button
            onClick={onToggleSuspension}
            style={{
              width: "100%",
              background: isSuspended ? "#16a34a" : "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "13px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: isSuspended ? "0 4px 12px rgba(22, 163, 74, 0.25)" : "0 4px 12px rgba(220, 38, 38, 0.25)"
            }}
          >
            {isSuspended ? "✅ ยกเลิกการระงับบัญชี (Unsuspend Account)" : "🚫 ระงับการใช้งานชั่วคราว (Suspend Account)"}
          </button>
        </div>
      </div>
    </>
  ); 
}

function AdminMore({ onBack, onLogout }) { 
  return (
    <>
      <TopBar title="การตั้งค่าระบบ" onBack={onBack} />
      <div style={{ padding: "16px" }}>
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "18px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <div style={{ fontSize: "32px" }}>🛡️</div>
          <div>
            <b style={{ fontSize: "15px", color: "#0f172a", display: "block" }}>แอดมินระบบส่วนกลาง</b>
            <small style={{ color: "#64748b", fontSize: "12px" }}>Super Administrator</small>
          </div>
        </div>

        <button 
          onClick={onLogout}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: "12px",
            border: "none",
            background: "#ef4444",
            color: "white",
            fontWeight: 800,
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)"
          }}
        >
          ออกจากระบบแอดมิน (Log Out)
        </button>
      </div>
    </>
  ); 
}

function AdminNotice({ onBack }) { 
  return (
    <>
      <TopBar title="สถานะระบบ & การแจ้งเตือน" subtitle="System Status" onBack={onBack} />
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ background: "white", padding: "16px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
          <b style={{ color: "#0f172a", fontSize: "14px", display: "block", marginBottom: "4px" }}>🌐 Backend API Health</b>
          <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>API Server ทำงานปกติ รองรับการสั่งซื้อ, KDS, Dispatch และ Real-time Socket</p>
        </div>
        <div style={{ background: "white", padding: "16px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
          <b style={{ color: "#0f172a", fontSize: "14px", display: "block", marginBottom: "4px" }}>🔒 Security & Account Control</b>
          <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>แอดมินสามารถอนุมัติร้านค้าใหม่, ตรวจสอบเมนูอาหาร และสั่งระงับบัญชีได้ทันที</p>
        </div>
      </div>
    </>
  ); 
}
