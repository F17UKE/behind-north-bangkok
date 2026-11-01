// frontend/src/api/merchantApi.js
import { api } from "./axiosInstance";

export const merchantApi = {
  // ดึงรายการร้านค้าทั้งหมดที่เปิดอยู่
  async getMerchants() {
    const res = await api.get("/merchants");
    return res?.data || [];
  },

  // ดึงรายละเอียดร้านค้าตาม ID
  async getMerchantById(merchantId) {
    const res = await api.get(`/merchants/${merchantId}`);
    return res?.data || null;
  },

  // ดึงเมนูทั้งหมดของร้านค้า
  async getMerchantMenu(merchantId) {
    const res = await api.get(`/merchants/${merchantId}/menu`);
    return res?.data || [];
  },

  // ดึงรายละเอียดเมนูเดี่ยวพร้อมตัวเลือก
  async getMenuItemDetail(menuItemId) {
    const res = await api.get(`/menus/${menuItemId}`);
    return res?.data || null;
  },

  // ดึงข้อมูลซอย
  async getSois() {
    const res = await api.get("/sois");
    return res?.data || [];
  },

  // ดึงข้อมูลหอพัก
  async getDormitories() {
    const res = await api.get("/dormitories");
    return res?.data || [];
  },

  // คำนวณค่าจัดส่ง
  async getDeliveryFee(merchantId, dormitoryId) {
    const res = await api.get(`/merchants/${merchantId}/delivery-fee?dormitory_id=${dormitoryId}`);
    return res?.delivery_fee ?? 10;
  }
};

export default merchantApi;
