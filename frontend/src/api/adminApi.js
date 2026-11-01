// frontend/src/api/adminApi.js
import { api } from "./axiosInstance";

export const adminApi = {
  // ดึงรายการร้านค้าทั้งหมด
  async getAllMerchants() {
    const res = await api.get("/admin/merchants", {}, "ADMIN");
    return res?.data || [];
  },

  // ดึงรายการร้านค้าที่รอการอนุมัติ
  async getPendingMerchants() {
    const res = await api.get("/admin/merchants/pending", {}, "ADMIN");
    return res?.data || [];
  },

  // อนุมัติร้านค้า
  async approveMerchant(merchantId) {
    const res = await api.patch(`/admin/merchants/${merchantId}/approve`, null, {}, "ADMIN");
    return res?.data || res;
  },

  // ปฏิเสธหรือระงับร้านค้า
  async rejectMerchant(merchantId) {
    const res = await api.patch(`/admin/merchants/${merchantId}/reject`, null, {}, "ADMIN");
    return res?.data || res;
  }
};

export default adminApi;
