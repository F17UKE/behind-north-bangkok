// frontend/src/api/authApi.js
import { api, setToken, clearToken, getToken } from "./axiosInstance";

export const authApi = {
  // --- Customer Auth ---
  async loginCustomer(username, password) {
    const res = await api.post("/auth/customer/login", { username, password });
    if (res?.token) {
      setToken(res.token, "CUSTOMER");
      if (typeof window !== "undefined") {
        localStorage.setItem("customer_user", JSON.stringify(res.user || {}));
      }
    }
    return res;
  },

  async registerCustomer(userData) {
    const res = await api.post("/auth/customer/register", userData);
    if (res?.token) {
      setToken(res.token, "CUSTOMER");
      if (typeof window !== "undefined") {
        localStorage.setItem("customer_user", JSON.stringify(res.user || {}));
      }
    }
    return res;
  },

  // --- Merchant Auth ---
  async loginMerchant(username, password) {
    const res = await api.post("/auth/merchant/login", { username, password });
    if (res?.token) {
      setToken(res.token, "MERCHANT");
      if (typeof window !== "undefined") {
        localStorage.setItem("merchant_user", JSON.stringify(res.merchant || res.user || {}));
      }
    }
    return res;
  },

  async registerMerchant(merchantData) {
    const res = await api.post("/auth/merchant/register", merchantData);
    if (res?.token) {
      setToken(res.token, "MERCHANT");
      if (typeof window !== "undefined") {
        localStorage.setItem("merchant_user", JSON.stringify(res.merchant || res.user || {}));
      }
    }
    return res;
  },

  // --- Rider Auth ---
  async loginRider(username, password) {
    const res = await api.post("/auth/rider/login", { username, password });
    if (res?.token) {
      setToken(res.token, "RIDER");
      if (typeof window !== "undefined") {
        const riderData = res.rider || res.user || {};
        localStorage.setItem("rider_user", JSON.stringify(riderData));
      }
    }
    return res;
  },

  // --- Admin Auth ---
  async loginAdmin(username, password) {
    const res = await api.post("/auth/admin/login", { username, password });
    if (res?.token) {
      setToken(res.token, "ADMIN");
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_user", JSON.stringify(res.user || {}));
      }
    }
    return res;
  },

  async getProfile(role = "CUSTOMER") {
    const res = await api.get("/users/me", {}, role);
    return res?.profile || res?.user || res;
  },

  async updateProfile(data, role = "CUSTOMER") {
    const res = await api.put("/users/profile", data, {}, role);
    return res?.profile || res;
  },

  getCurrentUser(role = "CUSTOMER") {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(`${role.toLowerCase()}_user`);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isLoggedIn(role = "CUSTOMER") {
    return !!getToken(role);
  },

  logout(role = "CUSTOMER") {
    clearToken(role);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`${role.toLowerCase()}_user`);
    }
  }
};

export default authApi;
