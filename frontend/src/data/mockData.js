export const customerFoods = [
  {
    id: 1, name: "ครัวหลังมอ", category: "อาหารตามสั่ง", rating: 4.8, price: 45, emoji: "🍛",
    photo: "/store-kitchen.webp", delivery: "20–30 นาที", fee: "ส่งฟรีเมื่อครบ ฿120", tags: ["ขายดี", "อาหารจานเดียว"],
    menu: [
      { id: 101, name: "ข้าวกะเพราไก่ไข่ดาว", price: 45, emoji: "🍳", image: "/menu-krapao.webp", description: "กะเพราหอม ๆ ไข่ดาวกรอบ" },
      { id: 102, name: "ข้าวหมูกรอบคั่วพริกเกลือ", price: 65, emoji: "🥘", image: "/menu-crispy-pork.webp", description: "หมูกรอบคั่วพริกเกลือสูตรร้าน" },
      { id: 103, name: "หมูปิ้งข้าวเหนียว", price: 40, emoji: "🍢", image: "/menu-grilled-pork.webp", description: "หมูปิ้งหอมเตาถ่าน" },
      { id: 104, name: "ข้าวผัดไข่หมู", price: 55, emoji: "🍳", image: "/menu-fried-rice-real.webp", description: "ข้าวผัดกระทะหอมใส่หมูนุ่ม" },
      { id: 105, name: "ข้าวไก่กระเทียมไข่ดาว", price: 60, emoji: "🍗", image: "/menu-garlic-chicken.webp", description: "ไก่กระเทียมหอมพริกไทยกับไข่ดาว" },
    ],
  },
  {
    id: 2, name: "MIXE RUMM", category: "อาหารไทยฟิวชัน", rating: 4.7, price: 55, emoji: "🍜",
    photo: "/store-fusion.webp", delivery: "25–35 นาที", fee: "ส่ง ฿10", tags: ["เมนูทำสด", "รสจัดจ้าน"],
    menu: [
      { id: 201, name: "ข้าวแกงเขียวหวานไก่", price: 65, emoji: "🍲", image: "/menu-green-curry.webp", description: "แกงเข้มข้น หอมใบโหระพา" },
      { id: 202, name: "ข้าวไข่เจียวกรอบ", price: 45, emoji: "🍳", image: "/menu-omelet-rice.webp", description: "ไข่เจียวฟูกรอบ เสิร์ฟร้อน" },
      { id: 203, name: "ข้าวผัดกะเพราหมู", price: 55, emoji: "🌶️", image: "/menu-krapao.webp", description: "กะเพราหมูสับผัดแห้งหอมใบกะเพรา" },
      { id: 204, name: "ข้าวหมูกรอบ", price: 65, emoji: "🍛", image: "/menu-crispy-pork.webp", description: "หมูกรอบหั่นชิ้น เสิร์ฟพร้อมข้าวหอม" },
    ],
  },
  {
    id: 3, name: "ชานมหลังมหาลัย", category: "เครื่องดื่ม", rating: 4.9, price: 40, emoji: "🧋",
    photo: "/store-drinks.webp", delivery: "10–20 นาที", fee: "ส่ง ฿5", tags: ["ชงสดทุกแก้ว", "ยอดนิยม"],
    menu: [
      { id: 301, name: "ชาไทยไข่มุก", price: 40, emoji: "🧋", image: "/menu-thai-tea.webp", description: "ชาไทยหอมเข้ม ไข่มุกหนึบ" },
      { id: 302, name: "อเมริกาโน่เย็น", price: 45, emoji: "🧋", image: "/menu-iced-coffee.webp", description: "กาแฟคั่วกลาง สดชื่น" },
      { id: 303, name: "ข้าวเหนียวมะม่วง", price: 55, emoji: "🥭", image: "/menu-mango-sticky.webp", description: "มะม่วงสุกกับกะทิสด", customizationType: "dessert" },
      { id: 304, name: "โกโก้เย็น", price: 45, emoji: "🥤", image: "/menu-cocoa.webp", description: "โกโก้เข้มข้น หวานมัน", customizationType: "drink" },
      { id: 305, name: "นมสดคาราเมล", price: 45, emoji: "🥛", image: "/menu-caramel-milk.webp", description: "นมสดหอมคาราเมลเย็นชื่นใจ", customizationType: "drink" },
    ],
  },
  {
    id: 4, name: "ข้าวไก่ทอด", category: "อาหารจานเดียว", rating: 4.6, price: 50, emoji: "🍗",
    photo: "/store-chicken.webp", delivery: "20–30 นาที", fee: "ส่งฟรีเมื่อครบ ฿150", tags: ["กรอบนอกนุ่มใน", "อิ่มคุ้ม"],
    menu: [
      { id: 401, name: "ข้าวไก่ทอดซอสพริก", price: 55, emoji: "🍗", image: "/menu-fried-rice.webp", description: "ไก่ทอดกรอบเสิร์ฟพร้อมข้าวหอม" },
      { id: 402, name: "ไก่ผัดพริกกระเทียม", price: 50, emoji: "🍗", image: "/menu-chili-chicken.webp", description: "ไก่ผัดพริกกระเทียมหอม ๆ" },
      { id: 403, name: "ปีกไก่ทอดซอส", price: 60, emoji: "🍗", image: "/menu-wings.webp", description: "ปีกไก่ทอดกับซอสหวานเผ็ด" },
      { id: 404, name: "ข้าวไก่กระเทียมไข่ดาว", price: 60, emoji: "🍳", image: "/menu-garlic-chicken.webp", description: "ไก่กระเทียมหอม ๆ ไข่ดาวเยิ้ม" },
      { id: 405, name: "ปีกไก่ทอดซอสเกาหลี", price: 65, emoji: "🍗", image: "/menu-wings.webp", description: "ปีกไก่ทอดคลุกซอสเกาหลีหวานเผ็ด" },
    ],
  },
  ...[
    { id: 5, name: "ก๋วยเตี๋ยวเรือท่าน้ำ", category: "ก๋วยเตี๋ยว", rating: 4.8, price: 50, emoji: "🍜", photo: "/store-noodles.webp", delivery: "15–25 นาที", fee: "ส่ง ฿5", tags: ["น้ำซุปเข้มข้น", "ขายดี"], type: "noodles", items: [["ก๋วยเตี๋ยวเรือหมู",50,"/menu-boat-noodles.webp"],["ก๋วยเตี๋ยวเรือเนื้อ",60,"/menu-boat-noodles.webp"],["ก๋วยเตี๋ยวหมูน้ำตก",55,"/menu-boat-noodles.webp"],["หมูปิ้ง",35,"/menu-grilled-pork.webp"]] },
    { id: 6, name: "ส้มตำครกแซ่บ", category: "อาหารอีสาน", rating: 4.7, price: 45, emoji: "🥗", photo: "/store-som-tam.webp", delivery: "20–30 นาที", fee: "ส่ง ฿10", tags: ["แซ่บถึงใจ", "ตำสดทุกครก"], type: "salad", items: [["ส้มตำไทย",45,"/menu-papaya-salad.webp"],["ตำปูปลาร้า",50,"/menu-papaya-salad.webp"],["ตำข้าวโพดไข่เค็ม",60,"/menu-corn-salad.webp"],["คอหมูย่าง",75,"/menu-grilled-pork.webp"]] },
    { id: 7, name: "ทะเลย่างริมทาง", category: "อาหารทะเล", rating: 4.9, price: 80, emoji: "🦐", photo: "/store-seafood.webp", delivery: "25–35 นาที", fee: "ส่ง ฿15", tags: ["ทะเลสด", "น้ำจิ้มซีฟู้ด"], type: "seafood", items: [["กุ้งเผา",120,"/menu-grilled-prawns.webp"],["ปลาหมึกย่าง",90,"/menu-grilled-squid.webp"],["ข้าวผัดทะเล",75,"/menu-seafood-fried-rice.webp"],["หอยเชลล์อบเนย",110,"/menu-scallops.webp"]] },
    { id: 8, name: "บ้านขนมหวาน", category: "ของหวาน", rating: 4.8, price: 40, emoji: "🍰", photo: "/store-dessert.webp", delivery: "15–25 นาที", fee: "ส่ง ฿5", tags: ["ทำสด", "หวานกำลังดี"], type: "dessert", items: [["ข้าวเหนียวมะม่วง",65,"/menu-mango-sticky.webp"],["บัวลอยมะพร้าวอ่อน",45,"/menu-bualoy.webp"],["ปังปิ้งเนยนม",40,"/menu-sweet-toast.webp"],["เฉาก๊วยนมสด",40,"/menu-grass-jelly-milk.webp"]] },
    { id: 9, name: "เบอร์เกอร์มุมตึก", category: "เบอร์เกอร์", rating: 4.6, price: 69, emoji: "🍔", photo: "/store-burger.webp", delivery: "20–30 นาที", fee: "ส่ง ฿10", tags: ["ทำสดตามออเดอร์", "ชีสเยิ้ม"], type: "burger", items: [["ชีสเบอร์เกอร์เนื้อ",89,"/menu-burger.webp"],["เบอร์เกอร์ไก่กรอบ",79,"/menu-chicken-burger.webp"],["เฟรนช์ฟรายส์",45,"/menu-fries.webp"],["นักเก็ตไก่",55,"/menu-nuggets.webp"]] },
    { id: 10, name: "ครัวแกงใต้", category: "ข้าวแกง", rating: 4.7, price: 55, emoji: "🍛", photo: "/store-curry.webp", delivery: "20–30 นาที", fee: "ส่งฟรีเมื่อครบ ฿150", tags: ["แกงใต้รสจัด", "กับข้าวทำใหม่"], type: "rice", items: [["ข้าวแกงมัสมั่นไก่",65,"/menu-massaman.webp"],["ข้าวหมูหวาน",55,"/menu-sweet-pork-rice.webp"],["ข้าวไก่ทอดกรอบ",60,"/menu-fried-rice.webp"],["ไข่พะโล้",25,"/menu-braised-egg.webp"]] },
    { id: 11, name: "ราเมงโต๊ะไม้", category: "อาหารญี่ปุ่น", rating: 4.8, price: 75, emoji: "🍜", photo: "/store-ramen.webp", delivery: "25–35 นาที", fee: "ส่ง ฿10", tags: ["น้ำซุปเคี่ยว", "เส้นสด"], type: "noodles", items: [["ทงคตสึราเมง",89,"/menu-ramen.webp"],["โชยุราเมง",79,"/menu-shoyu-ramen.webp"],["ข้าวหน้าหมูชาชู",85,"/menu-chashu-rice.webp"],["เกี๊ยวซ่าทอด",55,"/menu-gyoza.webp"]] },
    { id: 12, name: "เช้าดีบรันช์คาเฟ่", category: "คาเฟ่", rating: 4.7, price: 60, emoji: "🥞", photo: "/store-brunch.webp", delivery: "20–30 นาที", fee: "ส่ง ฿10", tags: ["บรันช์ทั้งวัน", "กาแฟหอม"], type: "brunch", items: [["แพนเค้กผลไม้",85,"/menu-pancakes.webp"],["ไข่คนโทสต์",75,"/menu-scrambled-toast.webp"],["ลาเต้เย็น",55,"/menu-iced-coffee.webp"],["แซนด์วิชไก่",69,"/menu-chicken-sandwich.webp"]] },
    { id: 13, name: "ย่างดีหมูย่าง", category: "ปิ้งย่าง", rating: 4.6, price: 50, emoji: "🍖", photo: "/store-grill.webp", delivery: "20–30 นาที", fee: "ส่ง ฿10", tags: ["ย่างเตาถ่าน", "น้ำจิ้มแจ่ว"], type: "rice", items: [["ข้าวคอหมูย่าง",65,"/menu-grilled-platter.webp"],["หมูปิ้งนมสด",45,"/menu-grilled-pork.webp"],["ไก่ย่างสมุนไพร",60,"/menu-herb-grilled-chicken.webp"],["ข้าวเหนียว",15,"/menu-grilled-platter.webp"]] },
    { id: 15, name: "ชาบูชิลล์", category: "ชาบู", rating: 4.7, price: 69, emoji: "🍲", photo: "/store-hotpot.webp", delivery: "25–35 นาที", fee: "ส่ง ฿15", tags: ["ชุดพร้อมทาน", "น้ำซุปเข้มข้น"], type: "hotpot", items: [["ชุดชาบูหมู",99,"/menu-hotpot.webp"],["ชุดชาบูเนื้อ",129,"/menu-hotpot.webp"],["ชุดผักรวม",49,"/menu-hotpot-vegetables.webp"],["ชุดชาบูน้ำซุปเข้มข้น",25,"/menu-hotpot.webp"]] },
  ].map((shop) => ({ ...shop, menu: shop.items.map(([name, price, image], index) => ({ id: shop.id * 100 + index + 1, name, price, emoji: shop.emoji, image, description: `${name} ปรุงสดใหม่ตามสั่ง`, customizationType: shop.type })) })),
];

export const stores = customerFoods;

export const customerMenu = [
  { id: 1, name: "ข้าวกะเพราไก่", price: 45, emoji: "🌶️" },
  { id: 2, name: "ข้าวไข่เจียว", price: 35, emoji: "🍳" },
  { id: 3, name: "กะเพราหมูสับ", price: 45, emoji: "🥘" },
  { id: 4, name: "ไข่ดาว", price: 10, emoji: "🍳" },
];

export const menuItems = customerMenu;

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
  PENDING_PAYMENT: "รอชำระเงิน",
  PAID: "ชำระเงินแล้ว",
  PENDING_ACCEPT: "รอร้านรับออเดอร์",
  PREPARING: "กำลังเตรียมอาหาร",
  READY_FOR_DELIVERY: "พร้อมจัดส่ง",
  IN_DELIVERY: "กำลังจัดส่ง",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
  CANCELLED_BY_CUSTOMER: "ยกเลิกโดยลูกค้า",
  CANCELLED_BY_MERCHANT: "ปฏิเสธโดยร้านค้า",
};
