// frontend/src/api/riderApi.js
import { api, getToken } from "./axiosInstance";

export const riderApi = {
  // ดึงรายการงานจัดส่งที่มอบหมายให้ Rider คนนี้
  async getRiderOrders() {
    const token = getToken("RIDER");
    if (!token) return [];
    try {
      const res = await api.get("/riders/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data || res || [];
    } catch (err) {
      console.warn("Error fetching rider orders:", err.message);
      return [];
    }
  },

  // อัปเดตสถานะการจัดส่ง (IN_DELIVERY -> COMPLETED)
  async updateOrderStatus(orderId, status) {
    const token = getToken("RIDER");
    const res = await api.put(`/riders/orders/${orderId}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res;
  }
};

export default riderApi;
