"use client";

import { useEffect, useState } from "react";
import MerchantKDS from "../../../views/merchant/MerchantKDS";
import { authApi } from "../../../api/authApi";
import MerchantLogin from "../../../views/merchant/MerchantLogin";

export default function StandaloneKDSPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const logged = authApi.isLoggedIn("MERCHANT");
    setIsLoggedIn(logged);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <b>กำลังโหลดจอครัว KDS...</b>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", padding: "20px" }}>
        <div style={{ maxWidth: "420px", margin: "40px auto", background: "#1e293b", padding: "24px", borderRadius: "16px", color: "white" }}>
          <h2 style={{ textAlign: "center", marginBottom: "16px" }}>เข้าสู่ระบบจอครัว KDS</h2>
          <MerchantLogin
            onSuccess={() => setIsLoggedIn(true)}
            onBack={() => { window.location.href = "/merchant"; }}
          />
        </div>
      </div>
    );
  }

  return <MerchantKDS isStandalone={true} onBack={() => { window.location.href = "/merchant"; }} />;
}
