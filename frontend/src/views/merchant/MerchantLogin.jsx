"use client";

import { useState } from "react";
import Link from "next/link";
import { authApi } from "../../api/authApi";

export default function MerchantLogin({ onSuccess, onBack }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [location, setLocation] = useState("");
  const [promptpayId, setPromptpayId] = useState("");
  const [email, setEmail] = useState("");
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await authApi.loginMerchant(username.trim(), password);
        if (res?.token) {
          const merchantData = res.merchant || res.user || { username };
          onSuccess(merchantData);
        } else {
          setError(res?.error || "เข้าสู่ระบบไม่สำเร็จ โปรดตรวจสอบชื่อผู้ใช้หรือรหัสผ่าน");
        }
      } else {
        // โหมดสมัครร้านค้าใหม่ (Sign Up)
        const payload = {
          username: username.trim(),
          password,
          store_name: storeName.trim(),
          location: location.trim() || undefined,
          promptpay_id: promptpayId.trim() || undefined,
          email: email.trim() || undefined
        };
        const res = await authApi.registerMerchant(payload);
        if (res?.token || res?.merchant) {
          const merchantData = res.merchant || { username, store_name: storeName, is_approved: false };
          onSuccess(merchantData);
        } else {
          setError(res?.error || "การสมัครร้านค้าไม่สำเร็จ โปรดตรวจสอบข้อมูล");
        }
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "เกิดข้อผิดพลาดในการดำเนินการ");
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
          <div className="brand-badge-icon" style={{ background: "#d1fae5", color: "#065f46", borderColor: "#a7f3d0" }}>
            🏪 Merchant Portal
          </div>
          <h2>{mode === "login" ? "เข้าสู่ระบบร้านค้า" : "สมัครเปิดร้านค้าใหม่"}</h2>
          <p>
            {mode === "login"
              ? "จัดการคำสั่งซื้อ เมนูอาหาร และรับออเดอร์ Real-time หลัง มจพ."
              : "ลงทะเบียนร้านค้าของคุณ เริ่มต้นเพิ่มเมนูและตั้งค่าร้านได้ทันที"}
          </p>
        </div>

        {error && (
          <div className="modern-auth-error">
            ⚠️ {error}
          </div>
        )}

        {mode === "signup" ? (
          <div className="auth-notice-banner" style={{ background: "#ecfdf5", borderColor: "#a7f3d0", color: "#065f46" }}>
            ℹ️ <b>สมัครแล้วเข้าใช้งานได้ทันที:</b> คุณสามารถเพิ่มเมนูอาหารและตั้งค่าข้อมูลร้านค้าได้เลย แต่ร้านจะยังไม่เปิดรับออเดอร์จากลูกค้าจนกว่าผู้ดูแลระบบ (Admin) จะอนุมัติร้านค้า
          </div>
        ) : (
          <div className="auth-notice-banner" style={{ background: "#ecfdf5", borderColor: "#a7f3d0", color: "#065f46" }}>
            🔑 <b>รหัสผ่านเริ่มต้นของทุกร้าน:</b> <code style={{ background: "#d1fae5", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>merchant1234</code>
          </div>
        )}

        <form className="modern-auth-form" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <div className="auth-field-group">
                <label>ชื่อร้านอาหารของคุณ (Store Name) *</label>
                <input
                  type="text"
                  placeholder="เช่น ข้าวมันไก่ตอน สูตรโกฮับ"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field-group">
                <label>สถานที่ตั้งร้านค้า (Location)</label>
                <input
                  type="text"
                  placeholder="เช่น หลังมอ ซอย 11 หรือ หน้าหอ S9"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="auth-field-group">
                <label>เบอร์ PromptPay สำหรับรับเงิน (10 หรือ 13 หลัก)</label>
                <input
                  type="text"
                  placeholder="เช่น 0812345678"
                  value={promptpayId}
                  onChange={(e) => setPromptpayId(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </>
          )}

          <div className="auth-field-group">
            <label>ชื่อผู้ใช้งาน (Username) *</label>
            <input
              type="text"
              placeholder={mode === "signup" ? "ภาษาอังกฤษและตัวเลข เช่น my_store" : "เช่น chefjenny หรือ kinraidee"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          {mode === "signup" && (
            <div className="auth-field-group">
              <label>อีเมลสำหรับติดต่อ (Email)</label>
              <input
                type="email"
                placeholder="เช่น store@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          )}

          <div className="auth-field-group">
            <label>รหัสผ่านร้านค้า (Password) *</label>
            <input
              type="password"
              placeholder={mode === "signup" ? "รหัสผ่านอย่างน้อย 6 ตัวอักษร" : "รหัสผ่านของร้านค้า"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
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
            {loading
              ? "กำลังดำเนินการ..."
              : mode === "login"
              ? "เข้าสู่ระบบร้านค้า (Sign In)"
              : "สมัครเปิดร้านค้าและเริ่มใช้งาน (Register Store)"}
          </button>
        </form>

        <div className="modern-auth-toggle-row">
          <span>{mode === "login" ? "ต้องการเปิดร้านค้าใหม่ใช่ไหม?" : "มีบัญชีร้านค้าอยู่แล้ว?"}</span>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
            style={{ color: "#059669" }}
          >
            {mode === "login" ? "สมัครเปิดร้านค้าใหม่ที่นี่" : "เข้าสู่ระบบที่นี่"}
          </button>
        </div>

        {mode === "login" && (
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
        )}
      </div>
    </div>
  );
}
