"use client";

import { useState } from "react";
import Link from "next/link";
import { authApi } from "../../api/authApi";

export default function MerchantLogin({ onSuccess, onBack }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // รายการบัญชีร้านค้าตัวอย่างสำหรับคลิกเลือกทดสอบได้ทันที
  const sampleStores = [
    { name: "ตามสั่ง by เชฟเจนนี่", username: "chefjenny", desc: "อาหารตามสั่ง หลังมอ" },
    { name: "KIN RAI DEE", username: "kinraidee", desc: "อาหารจานเดียว ญี่ปุ่น-เกาหลี" },
    { name: "เมืองนนท์หมูกระทะ", username: "muangnon", desc: "หมูกระทะถ้วย ปิ้งย่าง" },
    { name: "ครัวแม่ศรี หรอยแรง", username: "kruamaesri", desc: "แกงใต้ อาหารรสจัด" },
    { name: "ก๋วยเตี๋ยวลูกชิ้นปลา", username: "yentafo", desc: "เย็นตาโฟ จั๊บญวณ" },
    { name: "กินข้าวมั้ย", username: "kinkhaomai", desc: "อาหารตามสั่ง กะเพรา" },
    { name: "หมี่ไก่ฉีก by JK", username: "meekaichik", desc: "หมี่ไก่ฉีก น้ำพริกกากหมู" }
  ];

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authApi.loginMerchant(username.trim(), password);
      if (res?.token) {
        const merchantData = res.merchant || res.user || { username };
        onSuccess(merchantData);
      } else {
        setError(res?.error || "เข้าสู่ระบบไม่สำเร็จ โปรดตรวจสอบชื่อผู้ใช้หรือรหัสผ่าน");
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "เข้าสู่ระบบไม่สำเร็จ โปรดตรวจสอบข้อมูล");
    } finally {
      setLoading(false);
    }
  }

  function handleQuickFill(storeUser) {
    setUsername(storeUser);
    setPassword("merchant1234");
    setError("");
  }

  return (
    <div className="modern-auth-container merchant-theme">
      {onBack ? (
        <button className="modern-auth-back-btn" onClick={onBack}>
          ← กลับหน้าเลือกบทบาท (Role Select)
        </button>
      ) : (
        <Link href="/" className="modern-auth-back-btn">
          ← กลับหน้าเลือกบทบาท (Role Select)
        </Link>
      )}

      <div className="modern-auth-card merchant-card">
        <div className="modern-auth-header">
          <div className="brand-badge-icon" style={{ background: "#d1fae5", color: "#065f46" }}>
            🏪 Merchant Portal
          </div>
          <h2>เข้าสู่ระบบร้านค้า</h2>
          <p>จัดการคำสั่งซื้อ เมนูอาหาร และรับออเดอร์ Real-time หลัง มจพ.</p>
        </div>

        {error && (
          <div className="modern-auth-error">
            ⚠️ {error}
          </div>
        )}

        <div className="auth-notice-banner" style={{ background: "#ecfdf5", borderColor: "#a7f3d0", color: "#065f46" }}>
          🔑 <b>รหัสผ่านเริ่มต้นของทุกร้าน:</b> <code style={{ background: "#d1fae5", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>merchant1234</code>
        </div>

        <form className="modern-auth-form" onSubmit={handleLogin}>
          <div className="auth-field-group">
            <label>ชื่อผู้ใช้งานร้านค้า (Username หรือ Email)</label>
            <input
              type="text"
              placeholder="เช่น chefjenny หรือ kinraidee"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="auth-field-group">
            <label>รหัสผ่านร้านค้า (Password)</label>
            <input
              type="password"
              placeholder="รหัสผ่านของร้านค้า (merchant1234)"
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
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              boxShadow: "0 4px 14px rgba(5, 150, 105, 0.3)"
            }}
          >
            {loading ? "กำลังตรวจสอบข้อมูล..." : "เข้าสู่ระบบร้านค้า (Sign In)"}
          </button>
        </form>

        <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px dashed #e2e8f0" }}>
          <small style={{ display: "block", color: "#64748b", fontWeight: 600, marginBottom: "10px" }}>
            ⚡ เลือกบัญชีร้านค้าเพื่อเข้าสู่ระบบทันที:
          </small>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
            {sampleStores.map((s) => (
              <button
                key={s.username}
                type="button"
                onClick={() => handleQuickFill(s.username)}
                style={{
                  background: username === s.username ? "#10b981" : "#f8fafc",
                  color: username === s.username ? "#ffffff" : "#1e293b",
                  border: username === s.username ? "1.5px solid #059669" : "1px solid #cbd5e1",
                  borderRadius: "10px",
                  padding: "8px 10px",
                  fontSize: "12px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                <b style={{ display: "block", fontSize: "12px" }}>{s.name}</b>
                <span style={{ fontSize: "11px", opacity: 0.8 }}>user: {s.username}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
