"use client";

import { useState } from "react";
import Link from "next/link";
import { authApi } from "../../api/authApi";

export default function RiderLogin({ onSuccess, onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sampleRiders = [
    { username: "rider1", name: "สมศักดิ์ ไรเดอร์ซิ่ง", store: "ร้าน KIN RAI DEE" },
    { username: "rider2", name: "มานะ ส่งไว", store: "ร้าน กินข้าวมั้ย" },
    { username: "rider_jenny", name: "สายฟ้า เดลิเวอรี่", store: "ร้าน เชฟเจนนี่" },
    { username: "rider", name: "ไรเดอร์หลัง มจพ.", store: "ร้าน เชฟเจนนี่" }
  ];

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authApi.loginRider(username.trim(), password);
      if (res?.token) {
        const riderData = res.rider || res.user || { username };
        onSuccess(riderData);
      } else {
        setError(res?.error || "เข้าสู่ระบบไรเดอร์ไม่สำเร็จ โปรดตรวจสอบข้อมูล");
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "ชื่อผู้ใช้หรือรหัสผ่านไรเดอร์ไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickFill(riderUser) {
    setUsername(riderUser);
    setPassword("rider1234");
    setError("");
  }

  return (
    <div className="modern-auth-container rider-theme">
      {onBack ? (
        <button className="modern-auth-back-btn" onClick={onBack}>
          ← กลับหน้าเลือกบทบาท (Role Select)
        </button>
      ) : (
        <Link href="/" className="modern-auth-back-btn">
          ← กลับหน้าเลือกบทบาท (Role Select)
        </Link>
      )}

      <div className="modern-auth-card rider-card">
        <div className="modern-auth-header">
          <div className="brand-badge-icon" style={{ background: "#fef3c7", color: "#b45309" }}>
            🛵 Rider Delivery
          </div>
          <h2>เข้าสู่ระบบไรเดอร์</h2>
          <p>ระบบรับงานและนำส่งอาหารสำหรับพนักงานส่งประจำร้าน มจพ.</p>
        </div>

        {error && <div className="modern-auth-error">⚠️ {error}</div>}

        <div className="auth-notice-banner" style={{ background: "#fffbeb", borderColor: "#fde68a", color: "#92400e" }}>
          🔑 <b>รหัสผ่านเริ่มต้นของไรเดอร์:</b> <code style={{ background: "#fef3c7", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>rider1234</code>
        </div>

        <form className="modern-auth-form" onSubmit={handleLogin}>
          <div className="auth-field-group">
            <label>ชื่อผู้ใช้งานไรเดอร์ (Username)</label>
            <input
              type="text"
              placeholder="เช่น rider1 หรือ rider_jenny"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="auth-field-group">
            <label>รหัสผ่าน (Password)</label>
            <input
              type="password"
              placeholder="รหัสผ่านไรเดอร์ (rider1234)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            className="modern-auth-submit-btn"
            type="submit"
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              boxShadow: "0 4px 14px rgba(217, 119, 6, 0.3)"
            }}
          >
            {loading ? "กำลังตรวจสอบข้อมูล..." : "เข้าสู่ระบบไรเดอร์ (Sign In)"}
          </button>
        </form>

        <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px dashed #e2e8f0" }}>
          <small style={{ display: "block", color: "#64748b", fontWeight: 600, marginBottom: "10px" }}>
            ⚡ เลือกบัญชีไรเดอร์เพื่อเข้าสู่ระบบทันที:
          </small>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
            {sampleRiders.map((r) => (
              <button
                key={r.username}
                type="button"
                onClick={() => handleQuickFill(r.username)}
                style={{
                  background: username === r.username ? "#f59e0b" : "#fffbeb",
                  color: username === r.username ? "#ffffff" : "#78350f",
                  border: username === r.username ? "1.5px solid #d97706" : "1px solid #fde68a",
                  borderRadius: "10px",
                  padding: "8px 10px",
                  fontSize: "12px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                <b style={{ display: "block", fontSize: "12px" }}>{r.name}</b>
                <span style={{ fontSize: "11px", opacity: 0.85 }}>{r.store}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
