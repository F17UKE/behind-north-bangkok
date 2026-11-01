// frontend/src/api/orderApi.js
import { api } from "./axiosInstance";

export const orderApi = {
  // --- Customer Order Operations ---
  // สร้างออเดอร์ใหม่
  async createOrder(orderPayload) {
    const res = await api.post("/orders", orderPayload, {}, "CUSTOMER");
    return res?.data || res;
  },

  // ดึงรายการออเดอร์ของลูกค้า
  async getCustomerOrders() {
    const res = await api.get("/order-workflow/customer/orders", {}, "CUSTOMER");
    return res?.data || [];
  },

  // ขอยกเลิกออเดอร์ (ก่อนชำระเงิน)
  async cancelOrder(orderId) {
    const res = await api.put(`/order-workflow/orders/${orderId}/cancel`, {}, {}, "CUSTOMER");
    return res?.data || res;
  },

  // ดึง QR Code PromptPay สำหรับจ่ายเงิน
  async getPromptPayQR(orderId) {
    return await api.get(`/orders/${orderId}/payment/qr`, {}, "CUSTOMER");
  },

  // ส่งสลิปโอนเงินเพื่อตรวจสอบ
  async verifySlip(orderId, fileOrData) {
    let body;
    if (fileOrData instanceof File || fileOrData instanceof Blob) {
      body = new FormData();
      body.append("image", fileOrData);
    } else if (fileOrData && typeof fileOrData === "object" && !(fileOrData instanceof FormData)) {
      body = fileOrData;
    } else {
      body = fileOrData || {};
    }
    return await api.post(`/orders/${orderId}/payment/verify-slip`, body, {}, "CUSTOMER");
  },

  // --- Merchant Order Operations ---
  // ดึงรายการออเดอร์ของร้านค้า
  async getMerchantOrders() {
    const res = await api.get("/order-workflow/merchants/orders", {}, "MERCHANT");
    return res?.data || [];
  },

  // ร้านค้ารับออเดอร์
  async acceptOrder(orderId) {
    const res = await api.put(`/order-workflow/orders/${orderId}/accept`, {}, {}, "MERCHANT");
    return res?.data || res;
  },

  // ร้านค้าปฏิเสธออเดอร์
  async rejectOrder(orderId, reason = "") {
    const res = await api.put(`/order-workflow/orders/${orderId}/reject`, { reason }, {}, "MERCHANT");
    return res?.data || res;
  },

  // ร้านค้าเริ่มปรุงอาหาร
  async startPreparing(orderId) {
    const res = await api.put(`/order-workflow/orders/${orderId}/start-preparing`, {}, {}, "MERCHANT");
    return res?.data || res;
  },

  // KDS: ดึงออเดอร์ในครัว
  async getKitchenOrders() {
    const res = await api.get("/merchants/kds/orders", {}, "MERCHANT");
    return res?.orders || res?.data || [];
  },

  // KDS: ติ๊กเสร็จทั้งบิล (พร้อมจัดส่ง)
  async completeEntireOrder(orderId) {
    const res = await api.put(`/merchants/kds/orders/${orderId}/complete-all`, {}, {}, "MERCHANT");
    return res?.data || res;
  }
};

export default orderApi;
