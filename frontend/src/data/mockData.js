export const stores = [
  {
    id: "store-1",
    name: "ครัวหลังมอ",
    category: "อาหารตามสั่ง",
    rating: 4.8,
    reviews: 120,
    time: "15-25 นาที",
    open: true,
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "store-2",
    name: "ข้าวมันไก่ลุงหนวด",
    category: "ข้าว / อาหารจานเดียว",
    rating: 4.7,
    reviews: 98,
    time: "10-20 นาที",
    open: true,
    image:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "store-3",
    name: "ชานมหลังมหาลัย",
    category: "เครื่องดื่ม",
    rating: 4.6,
    reviews: 87,
    time: "5-15 นาที",
    open: false,
    image:
      "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=900&q=80"
  }
];

export const menuItems = [
  {
    id: 1,
    storeId: "store-1",
    name: "ข้าวกะเพราไก่",
    price: 45,
    available: true,
    image:
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 2,
    storeId: "store-1",
    name: "ข้าวไข่เจียว",
    price: 35,
    available: true,
    image:
      "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 3,
    storeId: "store-1",
    name: "กะเพราหมูสับ",
    price: 45,
    available: true,
    image:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 4,
    storeId: "store-1",
    name: "ไข่ดาว",
    price: 10,
    available: false,
    image:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80"
  }
];

export const orders = [
  {
    id: "#ORD001",
    customer: "นักศึกษา มจพ.",
    store: "ครัวหลังมอ",
    total: 90,
    status: "กำลังทำอาหาร",
    time: "10:25"
  },
  {
    id: "#ORD002",
    customer: "Petchtae",
    store: "ครัวหลังมอ",
    total: 75,
    status: "รอรับออเดอร์",
    time: "10:20"
  },
  {
    id: "#ORD003",
    customer: "Thanakrit",
    store: "ข้าวมันไก่ลุงหนวด",
    total: 120,
    status: "เสร็จสิ้น",
    time: "10:15"
  }
];

export const stats = {
  todayOrders: 24,
  todayRevenue: 1560,
  totalUsers: 1254,
  totalStores: 86,
  totalOrders: 432,
  totalRevenue: 28560
};