export const customerFoods = [
  { id: 1, name: "ครัวหลังมอ", category: "อาหารตามสั่ง", rating: 4.8, price: 40, emoji: "🍛" },
  { id: 2, name: "MIXE RUMM", category: "อาหาร / เครื่องดื่ม", rating: 4.7, price: 40, emoji: "🍜" },
  { id: 3, name: "กะเพราหมู", category: "อาหารตามสั่ง", rating: 4.9, price: 45, emoji: "🥘" },
  { id: 4, name: "ข้าวไก่ทอด", category: "ของทอด", rating: 4.6, price: 50, emoji: "🍗" },
];

export const customerMenu = [
  { id: 1, name: "ข้าวกะเพราไก่", price: 45, emoji: "🌶️" },
  { id: 2, name: "ข้าวไข่เจียว", price: 35, emoji: "🍳" },
  { id: 3, name: "กะเพราหมูสับ", price: 45, emoji: "🥘" },
  { id: 4, name: "ไข่ดาว", price: 10, emoji: "🍳" },
];

export const initialOrders = [
  { id: "#ORD001", store: "ครัวหลังมอ", items: ["ข้าวกะเพราไก่ x1", "ข้าวไข่เจียว x1"], total: 90, status: "PREPARING", date: "Today, 10:25" },
  { id: "#ORD000", store: "ครัวหลังมอ", items: ["ข้าวกะเพราไก่ x1"], total: 55, status: "COMPLETED", date: "Yesterday, 12:20" },
];

export const merchantOrdersSeed = [
  { id: "#ORD001", customer: "นักศึกษา มจพ.", total: 90, status: "PREPARING", items: ["ข้าวกะเพราไก่ x1", "ข้าวไข่เจียว x1"], time: "10:25" },
  { id: "#ORD002", customer: "Petchtae", total: 75, status: "PENDING_ACCEPT", items: ["ข้าวกะเพราไก่ x1", "น้ำเปล่า x1"], time: "10:20" },
  { id: "#ORD003", customer: "Thanakrit", total: 120, status: "READY_FOR_DELIVERY", items: ["ข้าวหมูกรอบ x2"], time: "10:15" },
];

export const adminUsers = [
  { id: 1, name: "นักศึกษา มจพ.", phone: "084-444-4444", role: "User", status: "active" },
  { id: 2, name: "Petchtae", phone: "081-222-3333", role: "Merchant", status: "active" },
  { id: 3, name: "Thanakrit", phone: "081-333-4444", role: "User", status: "active" },
  { id: 4, name: "Napat", phone: "082-444-5555", role: "User", status: "blocked" },
  { id: 5, name: "บ้านหลังมอ", phone: "083-555-6666", role: "Merchant", status: "active" },
  { id: 6, name: "Chonlatit", phone: "085-555-1212", role: "User", status: "active" },
];

export const statusLabel = {
  PENDING_ACCEPT: "รอร้านรับออเดอร์",
  PREPARING: "กำลังเตรียมอาหาร",
  READY_FOR_DELIVERY: "พร้อมจัดส่ง",
  IN_DELIVERY: "กำลังจัดส่ง",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
};
