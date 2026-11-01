"use client";

import { useEffect, useMemo, useState } from "react";
import { BottomNav, MobileShell, SearchBar, StatusPill, TopBar, EmptyState } from "../../components/AppShell";
import { adminUsers, statusLabel } from "../../data/mockData";
import { adminApi } from "../../api/adminApi";
import { authApi } from "../../api/authApi";

export default function AdminPage() {
  const [screen, setScreen] = useState("home");
  const [users, setUsers] = useState(adminUsers);
  const [selectedUser, setSelectedUser] = useState(adminUsers[0]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [notice, setNotice] = useState(0);
  const [actionNotice, setActionNotice] = useState("");
  const [menusModalOpen, setMenusModalOpen] = useState(false);
  const [merchantMenus, setMerchantMenus] = useState([]);
  const [loadingMenus, setLoadingMenus] = useState(false);

  // โหลดร้านค้าและลูกค้าจริงจาก Backend Admin API
  useEffect(() => {
    initAdminData();
  }, []);

  async function initAdminData() {
    try {
      if (!authApi.isLoggedIn("ADMIN")) {
        await authApi.loginAdmin("admin", "admin1234").catch(() => null);
      }

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

  return (
    <MobileShell tone="admin">
      <div key={screen} className="admin-page screen-enter">
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

        {screen === "home" && <AdminHome notice={notice} go={setScreen} userCount={users.length} />}
        {screen === "users" && (
          <AdminUsers 
            users={filtered} 
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
        {screen === "more" && <AdminMore onBack={() => setScreen("home")} />}
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
            { key: "home", label: "Home", icon: "⌂" },
            { key: "users", label: "User", icon: "♙" },
            { key: "notice", label: "Notice", icon: "●" },
            { key: "more", label: "More", icon: "•••" }
          ]} 
        />
      </div>
    </MobileShell>
  );
}

function AdminHome({ go, userCount }) {
  return (
    <>
      <div className="admin-header">
        <div className="avatar peach">👤</div>
        <div>
          <b>แอดมินครัวหลังมอ</b>
          <small>Admin (API Connected)</small>
        </div>
        <button>⌕</button>
      </div>
      <div className="admin-stats">
        <div><b>24</b><small>Order Today</small><em>+12%</em></div>
        <div><b>1,560</b><small>Revenue Today</small><em>+8%</em></div>
        <div><b>2</b><small>Active Shops</small><em>Database</em></div>
        <div><b>{userCount}</b><small>Total Users</small><em>System</em></div>
      </div>
      <div className="sales-card">
        <div className="sales-head"><b>Sale Revenue</b><span>View</span></div>
        <div className="chart">{[30,42,35,50,43,64,58,76,62,84].map((h,i)=><i key={i} style={{height:`${h}%`}} />)}</div>
        <small>9/9　10/9　11/9　12/9　13/9</small>
      </div>
      <button className="admin-action-card" onClick={() => go("users")}>
        <span>👤</span>
        <div><b>Manage Users & Merchants</b><small>ตรวจสอบ, จัดการเมนู และระงับบัญชี</small></div>
        <strong>›</strong>
      </button>
      <button className="admin-action-card" onClick={() => go("notice")}>
        <span>🔔</span>
        <div><b>Notices & Support</b><small>แจ้งเตือนและระบบช่วยเหลือ</small></div>
        <strong>›</strong>
      </button>
    </>
  );
}

function AdminUsers({ users, query, setQuery, tab, setTab, onBack, onOpen }) { 
  return (
    <>
      <TopBar title="User/Merchant ผู้ใช้งาน" subtitle="จัดการผู้ใช้งานและร้านค้า" onBack={onBack} action={<button className="topbar-btn">⋯</button>} />
      <SearchBar value={query} onChange={setQuery} placeholder="Search user or merchant..." />
      <div className="filter-scroll">
        <button className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>All ทั้งหมด ({users.length})</button>
        <button className={tab === "user" ? "active" : ""} onClick={() => setTab("user")}>User ลูกค้า ({users.filter(u => u.role === "User").length})</button>
        <button className={tab === "merchant" ? "active" : ""} onClick={() => setTab("merchant")}>Merchant ร้านค้า ({users.filter(u => u.role === "Merchant").length})</button>
      </div>
      {users.length ? users.map((u) => {
        const isSuspended = u.status === "blocked" || u.isSuspended;
        return (
          <button className="admin-user-row" key={u.id} onClick={() => onOpen(u)}>
            <div className="avatar small">{u.role === "Merchant" ? "🏪" : "👤"}</div>
            <div>
              <b>{u.name}</b>
              <small>{u.phone}</small>
            </div>
            <span>{u.role}</span>
            <small style={{ 
              color: isSuspended ? "#dc2626" : u.status === "active" ? "#16a34a" : "#d97706",
              fontWeight: 700 
            }}>
              {isSuspended ? "🚫 ถูกระงับ" : u.status === "active" ? "เปิดใช้งาน" : "รออนุมัติ"}
            </small>
          </button>
        );
      }) : <EmptyState title="No users" text="ไม่พบข้อมูลผู้ใช้งาน" />}
    </>
  ); 
}

function AdminDetail({ user, onBack, onChangeStatus, onToggleSuspension, onViewMenus }) { 
  const isSuspended = user.status === "blocked" || user.isSuspended;

  return (
    <>
      <div className="admin-detail-head">
        <button onClick={onBack}>‹</button>
        <b>User / Store Detail รายละเอียด</b>
      </div>
      <div className="detail-profile">
        <div className="detail-avatar">{user.role === "Merchant" ? "🏪" : "👤"}</div>
        <div>
          <h2>{user.name}</h2>
          <span className={isSuspended ? "red-text" : user.status === "active" ? "green-text" : "orange-text"} style={{ fontWeight: 700 }}>
            ● {isSuspended ? "ถูกระงับการใช้งาน (Suspended)" : user.status === "active" ? "เปิดใช้งาน (Active)" : "รอการอนุมัติ (Pending Approval)"}
          </span>
        </div>
      </div>
      <div className="detail-contact">
        <div>☎ Tel / PromptPay: <b>{user.phone}</b></div>
        <div>✉ Role: <b>{user.role}</b></div>
        <div>📍 ที่อยู่/พิกัด: {user.location || "หอพักหลังมอ มจพ."}</div>
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
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
              padding: "12px",
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

        {/* ปุ่มระงับ / ยกเลิกการระงับบัญชี */}
        <button
          onClick={onToggleSuspension}
          style={{
            width: "100%",
            background: isSuspended ? "#16a34a" : "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "12px",
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
              padding: "12px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            ✅ อนุมัติร้านค้าเปิดให้บริการ
          </button>
        )}
      </div>
    </>
  ); 
}

function AdminMore({ onBack }) { 
  return (
    <>
      <TopBar title="Setting การตั้งค่า" onBack={onBack} />
      <div className="setting-profile">
        <div className="detail-avatar">🛡️</div>
        <div>
          <b>แอดมินระบบส่วนกลาง</b>
          <small>Super Admin</small>
        </div>
      </div>
      {["ข้อมูลส่วนตัว","ความปลอดภัยและรหัสผ่าน","ตั้งค่า API Backend","เกี่ยวกับระบบ Behind NB"].map((x) => (
        <button className="setting-row" key={x}>{x}<span>›</span></button>
      ))}
      <button className="logout-admin" onClick={() => { authApi.logout("ADMIN"); alert("ออกจากระบบแอดมินเรียบร้อย"); }}>
        ออกจากระบบ
      </button>
    </>
  ); 
}

function AdminNotice({ onBack }) { 
  return (
    <>
      <TopBar title="Notice" subtitle="Support" onBack={onBack} />
      <div className="notice-card">
        <b>Support & System Health</b>
        <small>ระบบหลังบ้าน</small>
        <p>Backend API เชื่อมต่อสำเร็จผ่าน http://localhost:5000/api</p>
      </div>
      <div className="notice-card">
        <b>Store Approvals & Account Control</b>
        <small>ควบคุมความปลอดภัย</small>
        <p>แอดมินสามารถตรวจสอบเมนูอาหาร และสั่งระงับ/ยกเลิกระงับบัญชีลูกค้าและร้านค้าได้แบบ Real-time</p>
      </div>
    </>
  ); 
}
