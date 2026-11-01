"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BottomNav, MobileShell, SearchBar, TopBar, EmptyState } from "../../components/AppShell";
import { customerFoods, initialOrders, statusLabel, dormitories, sois } from "../../data/mockData";
import { authApi } from "../../api/authApi";
import { merchantApi } from "../../api/merchantApi";
import { orderApi } from "../../api/orderApi";
import { getSocket, playOrderChime } from "../../api/socketClient";
import "./CustomerStorefront.css";

const categories = ["All", "อาหารตามสั่ง", "หมูกระทะ", "ก๋วยเตี๋ยว", "อาหารจานเดียว", "แกงใต้"];
const defaultMenuGallery = customerFoods.flatMap((store) => store.menu.map((item) => ({ ...item, storeName: store.name, store })));
const heroMenuGallery = defaultMenuGallery.slice(0, 10);
const customizationOptions = {
  rice: [{ id: "fried-egg", name: "เพิ่มไข่ดาว", price: 12 }, { id: "omelet", name: "เพิ่มไข่เจียว", price: 15 }, { id: "extra-meat", name: "เพิ่มเนื้อสัตว์", price: 20 }, { id: "extra-rice", name: "เพิ่มข้าว", price: 10 }, { id: "crispy-garlic", name: "กระเทียมเจียว", price: 5 }],
  noodles: [{ id: "extra-noodle", name: "เพิ่มเส้น", price: 10 }, { id: "extra-meat", name: "เพิ่มเนื้อสัตว์", price: 20 }, { id: "meatball", name: "เพิ่มลูกชิ้น", price: 15 }, { id: "egg", name: "เพิ่มไข่ต้ม", price: 12 }, { id: "crispy-garlic", name: "กระเทียมเจียว", price: 5 }],
  salad: [{ id: "extra-shrimp", name: "เพิ่มกุ้ง", price: 25 }, { id: "extra-pork", name: "เพิ่มหมูยอ", price: 20 }, { id: "salted-egg", name: "เพิ่มไข่เค็ม", price: 15 }, { id: "rice-noodle", name: "เพิ่มขนมจีน", price: 10 }, { id: "extra-veggie", name: "เพิ่มผัก", price: 10 }],
  drink: [{ id: "pearls", name: "ไข่มุก", price: 10 }, { id: "pudding", name: "พุดดิ้ง", price: 15 }, { id: "jelly", name: "วุ้น", price: 10 }, { id: "espresso", name: "เพิ่มช็อตกาแฟ", price: 15 }, { id: "whipped-cream", name: "วิปครีม", price: 15 }],
  dessert: [{ id: "coconut", name: "เพิ่มกะทิ", price: 10 }, { id: "ice-cream", name: "ไอศกรีม", price: 20 }, { id: "sticky-rice", name: "เพิ่มข้าวเหนียว", price: 15 }, { id: "fruit", name: "เพิ่มผลไม้", price: 20 }],
  burger: [{ id: "cheese", name: "เพิ่มชีส", price: 15 }, { id: "bacon", name: "เพิ่มเบคอน", price: 25 }, { id: "patty", name: "เพิ่มเนื้อ/ไก่", price: 30 }, { id: "egg", name: "เพิ่มไข่ดาว", price: 12 }, { id: "fries", name: "เพิ่มเฟรนช์ฟรายส์", price: 25 }],
  seafood: [{ id: "seafood-dip", name: "น้ำจิ้มซีฟู้ดเพิ่ม", price: 10 }, { id: "extra-shrimp", name: "เพิ่มกุ้ง", price: 35 }, { id: "extra-squid", name: "เพิ่มปลาหมึก", price: 30 }, { id: "rice", name: "เพิ่มข้าวสวย", price: 12 }],
  brunch: [{ id: "egg", name: "เพิ่มไข่ดาว", price: 12 }, { id: "bacon", name: "เพิ่มเบคอน", price: 25 }, { id: "cheese", name: "เพิ่มชีส", price: 15 }, { id: "coffee", name: "เพิ่มกาแฟ 1 ช็อต", price: 15 }, { id: "fruit", name: "เพิ่มผลไม้", price: 20 }],
  hotpot: [{ id: "pork", name: "เพิ่มหมูสไลซ์", price: 35 }, { id: "beef", name: "เพิ่มเนื้อสไลซ์", price: 45 }, { id: "vegetable", name: "เพิ่มผักรวม", price: 25 }, { id: "egg", name: "เพิ่มไข่ไก่", price: 10 }, { id: "noodles", name: "เพิ่มวุ้นเส้น", price: 10 }],
};


export function getMenuCategory(item, storeCategory = "") {
  const name = item?.name || "";
  const desc = item?.description || "";
  const text = `${name} ${desc}`.toLowerCase();

  // 1. หมูกระทะ / ปิ้งย่าง
  if (text.includes("หมูกระทะ") || text.includes("ปิ้ง") || text.includes("ย่าง") || text.includes("ไซส์ m") || text.includes("ไซส์ l") || text.includes("ไซส์ xl") || text.includes("ถ้วยไซส์")) {
    return "หมูกระทะ / ปิ้งย่าง";
  }

  // 2. เมนูเส้น / ก๋วยเตี๋ยว
  if (text.includes("ก๋วยเตี๋ยว") || text.includes("เส้น") || text.includes("หมี่") || text.includes("บะหมี่") || text.includes("โฟ") || text.includes("เย็นตาโฟ") || text.includes("จั๊บ") || text.includes("มาม่า") || text.includes("สปาเก็ตตี้") || text.includes("ราดหน้า") || text.includes("สุกี้") || text.includes("ขนมจีน") || text.includes("วุ้นเส้น")) {
    return "เมนูเส้น / ก๋วยเตี๋ยว";
  }

  // 3. ต้ม / แกง / ต้มยำ
  if (text.includes("ต้มยำ") || text.includes("แกง") || text.includes("พะแนง") || text.includes("ฉู่ฉี่") || text.includes("ซุป") || (text.includes("ต้ม") && !text.includes("ไก่ต้ม"))) {
    return "ต้ม / แกง / ต้มยำ";
  }

  // 4. ของทานเล่น / กับข้าว
  if (text.includes("เฟรนฟราย") || text.includes("ไก่ป๊อบ") || text.includes("น้ำพริก") || text.includes("กากหมู") || text.includes("ไข่ดาว") || text.includes("ไข่เจียว") || text.includes("กุนเชียง") || text.includes("ไข่เยี่ยวม้า") || text.includes("ไก่กรอบยกเซต") || text.includes("ทันมูจิ") || text.includes("ขิงดอง") || text.includes("ออมเล็ต") || text.includes("ไข่กระทะ")) {
    return "ของทานเล่น / กับข้าว";
  }

  // 5. เครื่องดื่ม / ของหวาน
  if (text.includes("น้ำ") && (text.includes("ปั่น") || text.includes("หวาน") || text.includes("ชา") || text.includes("กาแฟ") || text.includes("บ๊วย") || text.includes("มะนาว") || text.includes("โซดา") || text.includes("เก๊กฮวย") || text.includes("นม") || text.includes("ขนม") || text.includes("เฉาก๊วย") || text.includes("ไอศกรีม"))) {
    return "เครื่องดื่ม / ของหวาน";
  }

  // 6. เมนูข้าว / อาหารจานเดียว (Default)
  return "อาหารจานเดียว / เมนูข้าว";
}

export default function CustomerPage() {
  const [screen, setScreen] = useState("home");
  const [storeList, setStoreList] = useState(customerFoods);
  const [selectedStore, setSelectedStore] = useState(customerFoods[0]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [heroIndex, setHeroIndex] = useState(0);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState(initialOrders[0]);
  const [savedPlace, setSavedPlace] = useState(false);
  const [savedAddress, setSavedAddress] = useState(null);
  const [profile, setProfile] = useState({ name: "", phone: "", email: "", isGuest: true });
  const [chatText, setChatText] = useState("");
  const [customItem, setCustomItem] = useState(null);
  const [customAddons, setCustomAddons] = useState([]);
  const [customNote, setCustomNote] = useState("");
  const [customQty, setCustomQty] = useState(1);
  const [apiNotice, setApiNotice] = useState("");
  const [dormList, setDormList] = useState(dormitories);
  const [soiList, setSoiList] = useState(sois);
  const [currentDorm, setCurrentDorm] = useState(dormitories[0]);
  const [currentDeliveryFee, setCurrentDeliveryFee] = useState(10);
  const [showDormPicker, setShowDormPicker] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const [pendingReturnScreen, setPendingReturnScreen] = useState(null);

  // 1. ตรวจสอบการล็อกอินและโหลดข้อมูลที่อยู่ / ร้านค้าเมื่อเปิดหน้า
  useEffect(() => {
    async function initCustomerData() {
      // โหลดข้อมูลหอพักและซอยจริงจากฐานข้อมูล PostgreSQL
      merchantApi.getSois().then(data => {
        if (Array.isArray(data) && data.length > 0) setSoiList(data);
      }).catch(() => {});

      merchantApi.getDormitories().then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map(d => ({
            id: d.id,
            name: d.name,
            soi: d.soi_name || `ซอย ${d.soi_id}`,
            soi_id: d.soi_id,
            location: d.location || ""
          }));
          setDormList(mapped);
          if (!savedAddress && mapped.length > 0) setCurrentDorm(mapped[0]);
        }
      }).catch(() => {});
      const savedUser = authApi.getCurrentUser("CUSTOMER");
      if (savedUser && authApi.isLoggedIn("CUSTOMER")) {
        setProfile({
          name: savedUser.username || savedUser.name || "ผู้ใช้งาน",
          phone: savedUser.phone || "",
          email: savedUser.email || "student@kmutnb.ac.th",
          isGuest: false
        });

        // ดึงข้อมูลจริงจาก PostgreSQL (GET /api/users/me)
        try {
          const remoteProfile = await authApi.getProfile("CUSTOMER");
          if (remoteProfile && (remoteProfile.id || remoteProfile.username)) {
            setProfile({
              name: remoteProfile.username || savedUser.username,
              phone: remoteProfile.phone || savedUser.phone || "",
              email: remoteProfile.email || savedUser.email || "student@kmutnb.ac.th",
              isGuest: false
            });

            if (remoteProfile.dormitory_id && remoteProfile.room_number) {
              const matchedDorm = dormitories.find(d => d.id === Number(remoteProfile.dormitory_id)) || {
                id: remoteProfile.dormitory_id,
                name: remoteProfile.dormitory_name || `หอพัก #${remoteProfile.dormitory_id}`,
                soi: remoteProfile.soi_name || ""
              };
              const addr = {
                dormitory: matchedDorm,
                roomNumber: String(remoteProfile.room_number),
                phone: remoteProfile.phone || savedUser.phone || "",
                note: ""
              };
              setSavedAddress(addr);
              setSavedPlace(true);
              setCurrentDorm(matchedDorm);
              try {
                localStorage.setItem(`behind_customer_address_${remoteProfile.id || remoteProfile.username}`, JSON.stringify(addr));
                localStorage.setItem("behind_customer_address", JSON.stringify(addr));
              } catch (e) {}
              loadCustomerOrders();
              return;
            }
          }
        } catch (err) {
          console.warn("Could not sync profile from server:", err);
        }

        // หากใน DB ยังไม่มีข้อมูล ให้ fallback ไปดูที่ localStorage
        try {
          const userKey = `behind_customer_address_${savedUser.id || savedUser.username}`;
          const storedAddr = localStorage.getItem(userKey) || localStorage.getItem("behind_customer_address");
          if (storedAddr) {
            const parsed = JSON.parse(storedAddr);
            if (parsed?.dormitory && parsed?.roomNumber) {
              setSavedAddress(parsed);
              setSavedPlace(true);
              if (parsed.dormitory) setCurrentDorm(parsed.dormitory);
            }
          }
        } catch (e) {}
        loadCustomerOrders();
      } else {
        setProfile({
          name: "",
          phone: "",
          email: "",
          isGuest: true
        });
        setSavedAddress(null);
        setSavedPlace(false);
      }
    }

    initCustomerData();
    loadMerchants();
  }, []);

  function hasDeliveryAddress() {
    return Boolean(savedAddress && savedAddress.dormitory && savedAddress.roomNumber && savedAddress.roomNumber.trim());
  }

  async function loadMerchants() {
    try {
      const data = await merchantApi.getMerchants();
      if (Array.isArray(data) && data.length > 0) {
        // ดึงรายการเมนูอาหารจริงของแต่ละร้านค้าจากฐานข้อมูล PostgreSQL (MENU_ITEMS)
        const merged = await Promise.all(
          data.map(async (store, i) => {
            let realMenu = [];
            try {
              const menuData = await merchantApi.getMerchantMenu(store.id);
              if (Array.isArray(menuData) && menuData.length > 0) {
                realMenu = menuData.map(m => ({
                  id: m.id,
                  name: m.name,
                  price: parseFloat(m.price || 0),
                  description: m.description || "",
                  image: m.image_url || null,
                  photo: m.image_url || null,
                  emoji: "🍛",
                  storeId: store.id,
                  storeName: store.store_name
                }));
              }
            } catch (me) {
              console.warn(`Could not load menu for merchant ${store.id}:`, me);
            }

            const fallback = customerFoods.find(cf => cf.id === store.id || cf.name.toLowerCase() === store.store_name.toLowerCase()) || customerFoods[i % customerFoods.length];
            const hasRealPhoto = store.store_image_url && (store.store_image_url.startsWith("http://") || store.store_image_url.startsWith("https://") || store.store_image_url.startsWith("/"));

            return {
              id: store.id,
              name: store.store_name,
              category: fallback?.category || "อาหารตามสั่ง",
              rating: fallback?.rating || 4.8,
              price: fallback?.price || 50,
              emoji: fallback?.emoji || "🍛",
              photo: hasRealPhoto ? store.store_image_url : (fallback?.photo || null),
              delivery: fallback?.delivery || "20–30 นาที",
              fee: "คิดตามซอยหอพัก",
              tags: fallback?.tags || ["เปิดบริการ"],
              menu: realMenu.length > 0 ? realMenu : (fallback?.menu || [])
            };
          })
        );
        setStoreList(merged);
        if (merged[0]) setSelectedStore(merged[0]);
      }
    } catch (err) {
      console.log("Error loading real merchants:", err.message);
    }
  }

  async function loadCustomerOrders() {
    try {
      const serverOrders = await orderApi.getCustomerOrders();
      if (Array.isArray(serverOrders) && serverOrders.length > 0) {
        const formatted = serverOrders.map(o => {
          const code = o.order_code ? (o.order_code.startsWith("#") ? o.order_code : `#${o.order_code}`) : `#ORD${String(o.id).padStart(3, "0")}`;
          return {
            id: code,
            order_code: code,
            rawId: o.id,
            store: o.store_name || "ร้านอาหารหลังมอ",
            items: Array.isArray(o.items) ? o.items.map(it => `${it.name || "อาหาร"} x${it.quantity || 1}`) : ["รายการอาหาร"],
            total: parseFloat(o.total_amount || 0),
            status: o.status || "PREPARING",
            date: o.created_at ? new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Today, now"
          };
        });
        setOrders(formatted);
      }
    } catch (err) {
      console.log("Could not load server orders:", err.message);
    }
  }

  // คำนวณค่าจัดส่งแบบ Real-time ตามร้านและหอพักที่เลือกจริงจาก PostgreSQL
  useEffect(() => {
    async function updateDeliveryFee() {
      const targetStoreId = cart[0]?.storeId || selectedStore?.id;
      const targetDormId = savedAddress?.dormitory?.id || currentDorm?.id;
      if (!targetStoreId || !targetDormId) return;

      try {
        const fee = await merchantApi.getDeliveryFee(targetStoreId, targetDormId);
        if (typeof fee === "number" && !isNaN(fee)) {
          setCurrentDeliveryFee(fee);
        }
      } catch (err) {
        console.warn("Could not fetch delivery fee:", err);
      }
    }
    updateDeliveryFee();
  }, [selectedStore?.id, currentDorm?.id, savedAddress?.dormitory?.id, cart]);

  const cartCount = cart.reduce((s, x) => s + x.qty, 0);
  const subtotal = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const deliveryFee = subtotal > 0 ? currentDeliveryFee : 0;
  const total = subtotal + deliveryFee;

  const filtered = useMemo(() => storeList.filter((food) => {
    const menuNames = food.menu ? food.menu.map((item) => item.name).join(" ") : "";
    const matchesSearch = `${food.name} ${food.category} ${menuNames}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || food.category?.includes(category);
    return matchesSearch && matchesCategory;
  }), [storeList, search, category]);

  useEffect(() => {
    if (screen !== "home") return undefined;
    const root = document.querySelector(".customer-home");
    if (!root) return undefined;

    const targets = root.querySelectorAll("[data-scroll-reveal]");
    root.classList.add("reveal-ready");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("reveal-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reveal-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -35px 0px" });
    targets.forEach((target, index) => {
      target.style.setProperty("--reveal-delay", `${Math.min(index, 5) * 75}ms`);
      observer.observe(target);
    });

    let frame = 0;
    const updateScrollMotion = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0;
        root.style.setProperty("--scroll-distance", `${Math.min(window.scrollY, 360)}px`);
        root.style.setProperty("--scroll-progress", `${progress * 100}%`);
      });
    };
    window.addEventListener("scroll", updateScrollMotion, { passive: true });
    updateScrollMotion();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateScrollMotion);
      if (frame) window.cancelAnimationFrame(frame);
      root.classList.remove("reveal-ready");
    };
  }, [screen, filtered]);

  useEffect(() => {
    if (screen !== "home" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => setHeroIndex((index) => (index + 1) % heroMenuGallery.length), 5200);
    return () => window.clearInterval(timer);
  }, [screen]);

  function addItem(item) {
    setCart((current) => {
      const key = item.cartLineId || String(item.id);
      const exists = current.find((x) => (x.cartLineId || String(x.id)) === key);
      return exists ? current.map((x) => (x.cartLineId || String(x.id)) === key ? { ...x, qty: x.qty + (item.qty || 1) } : x) : [...current, { ...item, qty: item.qty || 1 }];
    });
  }

  function changeQty(id, delta) {
    setCart((current) => current.map((x) => (x.cartLineId || x.id) === id ? { ...x, qty: x.qty + delta } : x).filter((x) => x.qty > 0));
  }

  function openCustomization(item, store) {
    const inferred = item.customizationType || (store.category?.includes("เครื่องดื่ม") ? "drink" : store.category?.includes("ของหวาน") ? "dessert" : "rice");
    setCustomItem({ ...item, storeId: store.id, storeName: store.name, customizationType: inferred });
    setCustomAddons([]);
    setCustomNote("");
    setCustomQty(1);
  }

  function confirmCustomization() {
    if (!customItem) return;
    const options = customizationOptions[customItem.customizationType] || customizationOptions.rice;
    const selected = options.filter((option) => customAddons.includes(option.id));
    const price = customItem.price + selected.reduce((sum, option) => sum + option.price, 0);
    const cartLineId = `${customItem.id}:${customAddons.slice().sort().join(",")}:${customNote.trim()}`;
    addItem({ ...customItem, basePrice: customItem.price, price, selectedAddons: selected, note: customNote.trim(), cartLineId, qty: customQty });
    setCustomItem(null);
  }

  async function openStore(store) {
    setSelectedStore(store);
    setScreen("store");
    try {
      const menus = await merchantApi.getMerchantMenu(store.id);
      if (Array.isArray(menus) && menus.length > 0) {
        const formattedMenu = menus.map(m => ({
          id: m.id,
          name: m.name,
          price: parseFloat(m.price) || 50,
          emoji: "🍛",
          image: m.image_url || null,
          description: m.description || `${m.name} ปรุงสดใหม่`,
          customizationType: "rice"
        }));
        setSelectedStore(prev => ({ ...prev, menu: formattedMenu }));
      }
    } catch (e) {
      console.log("Using store default menu");
    }
  }

  // ส่งออเดอร์ไปยัง Backend API
  async function placeOrder() {
    // 1. ตรวจสอบว่าเข้าสู่ระบบแล้วหรือยัง ถ้ายังให้พาไปหน้า Login ทันที
    if (!authApi.isLoggedIn("CUSTOMER")) {
      setApiNotice("🔒 กรุณาเข้าสู่ระบบก่อนทำการสั่งซื้ออาหาร");
      setPendingReturnScreen("place");
      setScreen("login");
      return;
    }

    // 2. ตรวจสอบว่าได้ระบุที่อยู่จัดส่งในโปรไฟล์แล้วหรือยัง
    if (!hasDeliveryAddress()) {
      setApiNotice("📍 กรุณาระบุที่อยู่จัดส่ง (เลือกหอพักและระบุเลขห้อง) ในโปรไฟล์ก่อนทำการสั่งซื้อ");
      setPendingReturnScreen("place");
      setScreen("save-place");
      return;
    }

    const itemsDescription = cart.map((x) => `${x.name}${x.selectedAddons?.length ? ` (${x.selectedAddons.map((option) => option.name).join(", ")})` : ""}${x.note ? ` · หมายเหตุ: ${x.note}` : ""} x${x.qty}`);
    const dorm = savedAddress.dormitory || currentDorm;
    const room = savedAddress.roomNumber.trim();

    // เตรียม Local Order สำรอง
    let newOrder = {
      id: `#ORD${String(orders.length + 2).padStart(3, "0")}`,
      store: cart[0]?.storeName || selectedStore.name || "ตามสั่ง by เชฟเจนนี่",
      items: itemsDescription,
      total,
      status: "PENDING_ACCEPT",
      date: "Today, now",
      qrImage: null,
      deliveryAddress: `${dorm.name} ห้อง ${room} (${dorm.soi})`
    };

    try {
      // เรียก Backend API ถ้ามี Token ล็อกอิน
      if (authApi.isLoggedIn("CUSTOMER")) {
        const orderPayload = {
          merchant_id: Number(selectedStore.id) || 1,
          merchantId: Number(selectedStore.id) || 1,
          dormitory_id: Number(dorm.id) || 1,
          dormitoryId: Number(dorm.id) || 1,
          room_number: `ห้อง ${room} (${dorm.name})`,
          roomNumber: `ห้อง ${room} (${dorm.name})`,
          items: cart.map(item => ({
            menu_item_id: Number(item.id) || 1,
            quantity: Number(item.qty) || 1,
            note: item.note || undefined,
            choices: []
          }))
        };

        const serverRes = await orderApi.createOrder(orderPayload);
        const respData = serverRes?.data || serverRes;
        const orderId = respData?.id;

        if (orderId) {
          newOrder.rawId = orderId;
          const assignedCode = respData.order_code ? (respData.order_code.startsWith("#") ? respData.order_code : `#${respData.order_code}`) : `#ORD${String(orderId).padStart(3, "0")}`;
          newOrder.order_code = assignedCode;
          newOrder.id = assignedCode;
          if (respData.total_amount) {
            newOrder.total = parseFloat(respData.total_amount);
          }
          // รอร้านค้ารับออเดอร์ก่อน ถึงจะสร้างและดึง QR Code PromptPay
          newOrder.status = "PENDING_ACCEPT";
        }
      }
    } catch (apiErr) {
      console.log("Create order API error, using client mode:", apiErr.message);
    }

    setOrders((current) => [newOrder, ...current]);
    setSelectedOrder(newOrder);
    setCart([]);
    setScreen("delivery");

    const socket = getSocket("CUSTOMER");
    if (socket && newOrder.rawId) {
      socket.emit("join_order_room", { orderId: newOrder.rawId });
    }
  }

  // Real-time Socket & Unread messages listener for Customer
  useEffect(() => {
    const socket = getSocket("CUSTOMER");
    if (!socket) return;

    const user = authApi.getCurrentUser("CUSTOMER");
    if (user?.id) {
      socket.emit("join_customer_room", { customer_id: user.id });
    }

    // ฟังอัปเดตสถานะออเดอร์ Real-time
    const handleStatus = (payload) => {
      const orderId = Number(payload.order_id || payload.orderId);
      console.log("⚡ [Customer Socket] ORDER_STATUS_UPDATED:", payload);

      const displayCode = payload.order_code 
        ? (payload.order_code.startsWith("#") ? payload.order_code : `#${payload.order_code}`)
        : (orderId ? `#ORD${String(orderId).padStart(3, "0")}` : "");

      if (payload.status === "PENDING_PAYMENT") {
        playOrderChime();
        setApiNotice(`🔔 ออเดอร์ ${displayCode}: ร้านค้ารับแล้ว! กรุณาสแกน QR ชำระเงิน`);
      } else if (payload.status === "REJECTED_BY_MERCHANT") {
        setApiNotice(`❌ ออเดอร์ ${displayCode}: ขออภัย ร้านค้าปฏิเสธคำสั่งซื้อ`);
      } else if (payload.status === "PREPARING") {
        playOrderChime();
        setApiNotice(`🍳 ออเดอร์ ${displayCode}: ชำระเงินสำเร็จ ร้านค้ากำลังปรุงอาหาร`);
      } else if (payload.status === "READY_FOR_DELIVERY") {
        playOrderChime();
        setApiNotice(`🍲 ออเดอร์ ${displayCode}: อาหารปรุงเสร็จแล้ว กำลังรอจัดส่ง`);
      } else if (payload.status === "IN_DELIVERY") {
        playOrderChime();
        setApiNotice(`🛵 ออเดอร์ ${displayCode}: ไรเดอร์กำลังนำส่งอาหารไปยังหอพัก`);
      } else if (payload.status === "COMPLETED") {
        playOrderChime();
        setApiNotice(`🎉 ออเดอร์ ${displayCode}: จัดส่งอาหารสำเร็จ อร่อยกับมื้อนี้นะครับ!`);
      }
      setTimeout(() => setApiNotice(""), 6000);

      setOrders(current => current.map(o => {
        if (o.rawId === orderId || o.id === `#ORD${String(orderId).padStart(3, "0")}`) {
          return { ...o, status: payload.status };
        }
        return o;
      }));

      setSelectedOrder(current => {
        if (current && (current.rawId === orderId || current.id === `#ORD${String(orderId).padStart(3, "0")}`)) {
          return { ...current, status: payload.status };
        }
        return current;
      });
    };

    // ฟังข้อความแชทใหม่ Real-time
    const handleNewChat = (payload) => {
      console.log("💬 [Customer Socket] NEW_CHAT_MESSAGE:", payload);
      playOrderChime();
      setUnreadChatCount(c => c + 1);
      setApiNotice(`💬 มีข้อความใหม่จากร้านค้า: ${payload.content_text || payload.contentText || ""}`);
    };

    const handleDeliveryFeeUpdate = (payload) => {
      console.log("⚡ [Customer Socket] DELIVERY_FEE_UPDATED:", payload);
      const activeStoreId = cart[0]?.storeId || selectedStore?.id;
      const activeDormSoiId = savedAddress?.dormitory?.soi_id || currentDorm?.soi_id;

      if (Number(payload.merchant_id) === Number(activeStoreId)) {
        if (!activeDormSoiId || Number(payload.soi_id) === Number(activeDormSoiId)) {
          setCurrentDeliveryFee(parseFloat(payload.fee));
          setApiNotice(`🔔 ร้านค้าปรับค่าส่งของซอยคุณเป็น ฿${payload.fee}`);
          setTimeout(() => setApiNotice(""), 3500);
        }
      }
    };

    socket.on("ORDER_STATUS_UPDATED", handleStatus);
    socket.on("NEW_CHAT_MESSAGE", handleNewChat);
    socket.on("DELIVERY_FEE_UPDATED", handleDeliveryFeeUpdate);

    // โหลด unread count เริ่มต้น
    if (authApi.isLoggedIn("CUSTOMER")) {
      orderApi.getUnreadCount("CUSTOMER").then(res => {
        if (res?.totalUnread) setUnreadChatCount(res.totalUnread);
      }).catch(() => {});
    }

    return () => {
      socket.off("ORDER_STATUS_UPDATED", handleStatus);
      socket.off("NEW_CHAT_MESSAGE", handleNewChat);
      socket.off("DELIVERY_FEE_UPDATED", handleDeliveryFeeUpdate);
    };
  }, []);

  // Polling fallback เมื่อออเดอร์อยู่ในสถานะ PENDING_ACCEPT (รอร้านรับ)
  useEffect(() => {
    if (!selectedOrder?.rawId || selectedOrder.status !== "PENDING_ACCEPT") return;

    const timer = setInterval(async () => {
      try {
        const freshOrders = await orderApi.getCustomerOrders();
        if (Array.isArray(freshOrders)) {
          const matched = freshOrders.find(o => o.id === selectedOrder.rawId);
          if (matched && matched.status !== "PENDING_ACCEPT") {
            setSelectedOrder(prev => ({ ...prev, status: matched.status }));
            setOrders(prev => prev.map(o => o.rawId === matched.id ? { ...o, status: matched.status } : o));
            if (matched.status === "PENDING_PAYMENT") {
              playOrderChime();
              setApiNotice("🔔 ร้านค้ารับออเดอร์แล้ว! กรุณาสแกน QR เพื่อชำระเงิน");
            }
          }
        }
      } catch (e) {}
    }, 3000);

    return () => clearInterval(timer);
  }, [selectedOrder?.rawId, selectedOrder?.status]);

  // ยืนยันการชำระเงินและตรวจสอบสลิปผ่าน API
  async function verifySlip(order, slipFile) {
    if (!order) return;
    try {
      const orderId = order.rawId || 1;
      let res;
      if (slipFile) {
        res = await orderApi.verifySlip(orderId, slipFile);
      } else {
        res = await orderApi.verifySlip(orderId, { simulated: true, amount: order.total });
      }

      const orderCode = order.order_code || order.id || "";
      setApiNotice(`✅ ออเดอร์ ${orderCode}: แนบสลิปสำเร็จ! ร้านค้าเริ่มเตรียมอาหารทันที`);
      const updatedOrder = { ...order, status: "PREPARING" };
      setSelectedOrder(updatedOrder);
      setOrders(current => current.map(o => (o.id === order.id || o.rawId === order.rawId ? updatedOrder : o)));
      setTimeout(() => setApiNotice(""), 5500);
    } catch (err) {
      alert("การตรวจสอบสลิปล้มเหลว: " + (err?.response?.data?.message || err.message));
    }
  }

  async function handleCancelOrder(order) {
    if (!confirm("คุณต้องการยกเลิกคำสั่งซื้อนี้ใช่หรือไม่?")) return;
    try {
      const orderId = order.rawId || 1;
      await orderApi.cancelOrder(orderId);
      setApiNotice("✅ ยกเลิกคำสั่งซื้อเรียบร้อยแล้ว");
      const updatedOrder = { ...order, status: "CANCELLED_BY_CUSTOMER" };
      setSelectedOrder(updatedOrder);
      setOrders(current => current.map(o => (o.id === order.id || o.rawId === order.rawId ? updatedOrder : o)));
      setTimeout(() => setApiNotice(""), 3000);
    } catch (err) {
      alert("ไม่สามารถยกเลิกคำสั่งซื้อได้: " + err.message);
    }
  }

  function sendChat(e) {
    e?.preventDefault();
    if (!chatText.trim()) return;
    setChatMessages((m) => [...m, { from: "me", text: chatText.trim() }]);
    setChatText("");
    setTimeout(() => setChatMessages((m) => [...m, { from: "store", text: "รับทราบครับ เดี๋ยวตรวจสอบให้นะครับ" }]), 450);
  }

  const nav = (key) => {
    if (key === "order") setScreen("recent");
    else if (key === "profile") setScreen("profile");
    else if (key === "cart") setScreen("basket");
    else setScreen("home");
  };

  return (
    <MobileShell>
      <div key={screen} className="mobile-page customer-page-shell screen-enter">
        {apiNotice && (
          <aside
            role="status"
            aria-live="polite"
            style={{
              position: "fixed",
              top: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 99999,
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              color: "#ffffff",
              padding: "10px 18px",
              borderRadius: "50px",
              fontSize: "13px",
              fontWeight: 600,
              boxShadow: "0 12px 30px -4px rgba(0, 0, 0, 0.45), 0 4px 12px -2px rgba(0, 0, 0, 0.25)",
              border: "1.5px solid rgba(255, 255, 255, 0.18)",
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              maxWidth: "92vw",
              boxSizing: "border-box"
            }}
          >
            <span style={{ fontSize: "16px" }}>⚡</span>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {apiNotice}
            </span>
            <button
              type="button"
              onClick={() => setApiNotice("")}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                color: "#ffffff",
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                lineHeight: 1
              }}
              aria-label="ปิดการแจ้งเตือน"
            >
              ✕
            </button>
          </aside>
        )}

        {screen === "home" && <CustomerHome search={search} setSearch={setSearch} category={category} setCategory={setCategory} foods={filtered} menu={defaultMenuGallery} featured={heroMenuGallery[heroIndex] || defaultMenuGallery[0]} heroIndex={heroIndex} setHeroIndex={setHeroIndex} heroCount={heroMenuGallery.length || 1} cartCount={cartCount} currentDorm={currentDorm} onOpenDormPicker={() => setShowDormPicker(true)} onStore={openStore} onCart={() => setScreen("basket")} onOrders={() => setScreen("recent")} onProfile={() => setScreen("profile")} />}
        {screen === "store" && <CustomerStore store={selectedStore} cartCount={cartCount} onBack={() => setScreen("home")} onCustomize={openCustomization} onBasket={() => setScreen("basket")} />}
        {screen === "basket" && (
          <Basket
            cart={cart}
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            total={total}
            changeQty={changeQty}
            isLoggedIn={authApi.isLoggedIn("CUSTOMER")}
            hasAddress={hasDeliveryAddress()}
            savedAddress={savedAddress}
            onRequireLogin={() => {
              setPendingReturnScreen("basket");
              setScreen("login");
            }}
            onRequireAddress={() => {
              setPendingReturnScreen("basket");
              setScreen("save-place");
            }}
            onBack={() => setScreen("store")}
            onNext={() => {
              if (!authApi.isLoggedIn("CUSTOMER")) {
                setApiNotice("🔒 กรุณาเข้าสู่ระบบก่อนดำเนินการสั่งซื้ออาหาร");
                setPendingReturnScreen("basket");
                setScreen("login");
                return;
              }
              if (!hasDeliveryAddress()) {
                setApiNotice("📍 กรุณาระบุที่อยู่จัดส่งในโปรไฟล์ก่อนสั่งอาหาร");
                setPendingReturnScreen("update");
                setScreen("save-place");
                return;
              }
              setScreen("update");
            }}
          />
        )}
        {screen === "update" && (
          <UpdateBasket
            cart={cart}
            total={total}
            savedPlace={savedPlace}
            setSavedPlace={setSavedPlace}
            changeQty={changeQty}
            isLoggedIn={authApi.isLoggedIn("CUSTOMER")}
            hasAddress={hasDeliveryAddress()}
            savedAddress={savedAddress}
            onRequireLogin={() => {
              setPendingReturnScreen("update");
              setScreen("login");
            }}
            onRequireAddress={() => {
              setPendingReturnScreen("update");
              setScreen("save-place");
            }}
            onBack={() => setScreen("basket")}
            onNext={() => {
              if (!authApi.isLoggedIn("CUSTOMER")) {
                setApiNotice("🔒 กรุณาเข้าสู่ระบบก่อนดำเนินการสั่งซื้ออาหาร");
                setPendingReturnScreen("place");
                setScreen("login");
                return;
              }
              if (!hasDeliveryAddress()) {
                setApiNotice("📍 กรุณาระบุที่อยู่จัดส่งในโปรไฟล์ก่อนสั่งอาหาร");
                setPendingReturnScreen("place");
                setScreen("save-place");
                return;
              }
              setScreen("place");
            }}
          />
        )}
        {screen === "place" && (
          <PlaceOrder
            cart={cart}
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            total={total}
            isLoggedIn={authApi.isLoggedIn("CUSTOMER")}
            hasAddress={hasDeliveryAddress()}
            savedAddress={savedAddress}
            onRequireLogin={() => {
              setPendingReturnScreen("place");
              setScreen("login");
            }}
            onRequireAddress={() => {
              setPendingReturnScreen("place");
              setScreen("save-place");
            }}
            onBack={() => setScreen("update")}
            onPlace={placeOrder}
          />
        )}
        {screen === "recent" && <Recent orders={orders} onOpen={(order) => { setSelectedOrder(order); setScreen("delivery"); }} onHome={() => setScreen("home")} />}
        {screen === "delivery" && <Delivery order={selectedOrder} onBack={() => setScreen("recent")} onChat={() => setScreen("chat")} onVerifySlip={(ord, slip) => verifySlip(ord, slip)} onCancelOrder={(ord) => handleCancelOrder(ord)} unreadMessages={unreadChatCount} />}
        {screen === "profile" && (
          <Profile
            profile={profile}
            savedAddress={savedAddress}
            onBack={() => setScreen("home")}
            onManageAddress={() => {
              if (profile.isGuest) {
                setApiNotice("🔒 กรุณาเข้าสู่ระบบก่อนเพื่อจัดการที่อยู่จัดส่ง");
                setPendingReturnScreen("profile");
                setScreen("login");
                return;
              }
              setPendingReturnScreen("profile");
              setScreen("save-place");
            }}
            onOrders={() => setScreen("recent")}
            onLogin={() => setScreen("login")}
            onLogout={() => {
              authApi.logout("CUSTOMER");
              setProfile({ name: "", phone: "", email: "", isGuest: true });
              setSavedAddress(null);
              setSavedPlace(false);
              setOrders([]);
              try {
                localStorage.removeItem("behind_customer_address");
              } catch (e) {}
              setApiNotice("ออกจากระบบเรียบร้อยแล้ว");
              setTimeout(() => setApiNotice(""), 2500);
            }}
          />
        )}
        {screen === "save-place" && (
          <SavePlace
            dormList={dormList}
            soiList={soiList}
            initialAddress={savedAddress}
            currentDorm={currentDorm}
            userPhone={profile.phone}
            onBack={() => {
              if (pendingReturnScreen) {
                const target = pendingReturnScreen;
                setPendingReturnScreen(null);
                setScreen(target);
              } else {
                setScreen("profile");
              }
            }}
            onSave={async (addr) => {
              setSavedAddress(addr);
              setSavedPlace(true);
              if (addr.dormitory) setCurrentDorm(addr.dormitory);
              if (addr.phone && !profile.phone) {
                setProfile(prev => ({ ...prev, phone: addr.phone }));
              }
              try {
                const user = authApi.getCurrentUser("CUSTOMER");
                if (user?.id || user?.username) {
                  localStorage.setItem(`behind_customer_address_${user.id || user.username}`, JSON.stringify(addr));
                }
                localStorage.setItem("behind_customer_address", JSON.stringify(addr));
              } catch (e) {}

              // บันทึกลง PostgreSQL Database ผ่าน API ทันที
              try {
                await authApi.updateProfile({
                  dormitory_id: addr.dormitory?.id,
                  room_number: addr.roomNumber,
                  phone: addr.phone || profile.phone
                }, "CUSTOMER");
                setApiNotice("✅ บันทึกที่อยู่จัดส่งลงระบบสำเร็จ!");
              } catch (err) {
                console.warn("Error updating profile in DB:", err);
                setApiNotice("✅ บันทึกที่อยู่จัดส่งเรียบร้อยแล้ว!");
              }

              setTimeout(() => setApiNotice(""), 3000);
              if (pendingReturnScreen) {
                const target = pendingReturnScreen;
                setPendingReturnScreen(null);
                setScreen(target);
              } else {
                setScreen("profile");
              }
            }}
          />
        )}
        {screen === "chat" && (
          <CustomerChat
            order={selectedOrder}
            storeName={selectedOrder?.store}
            onBack={() => setScreen("delivery")}
          />
        )}
        {screen === "login" && (
          <CustomerAuth
            mode="login"
            isOrdering={Boolean(pendingReturnScreen)}
            onBack={() => {
              if (pendingReturnScreen) {
                const target = pendingReturnScreen;
                setPendingReturnScreen(null);
                setScreen(target);
              } else {
                setScreen("profile");
              }
            }}
            onSuccess={async (user) => {
              setProfile({
                name: user.username,
                phone: user.phone || "081-234-5678",
                email: user.email || "student@kmutnb.ac.th",
                isGuest: false
              });
              // Sync ทันทีจาก PostgreSQL DB
              try {
                const remoteProfile = await authApi.getProfile("CUSTOMER");
                if (remoteProfile?.dormitory_id && remoteProfile?.room_number) {
                  const matchedDorm = dormitories.find(d => d.id === Number(remoteProfile.dormitory_id)) || {
                    id: remoteProfile.dormitory_id,
                    name: remoteProfile.dormitory_name || `หอพัก #${remoteProfile.dormitory_id}`,
                    soi: remoteProfile.soi_name || ""
                  };
                  const addr = {
                    dormitory: matchedDorm,
                    roomNumber: String(remoteProfile.room_number),
                    phone: remoteProfile.phone || user.phone || "",
                    note: ""
                  };
                  setSavedAddress(addr);
                  setSavedPlace(true);
                  setCurrentDorm(matchedDorm);
                  try {
                    localStorage.setItem(`behind_customer_address_${remoteProfile.id || remoteProfile.username}`, JSON.stringify(addr));
                    localStorage.setItem("behind_customer_address", JSON.stringify(addr));
                  } catch (e) {}
                } else {
                  const userKey = `behind_customer_address_${user.id || user.username}`;
                  const storedAddr = localStorage.getItem(userKey) || localStorage.getItem("behind_customer_address");
                  if (storedAddr) {
                    const parsed = JSON.parse(storedAddr);
                    if (parsed?.dormitory && parsed?.roomNumber) {
                      setSavedAddress(parsed);
                      setSavedPlace(true);
                      if (parsed.dormitory) setCurrentDorm(parsed.dormitory);
                    }
                  }
                }
              } catch (e) {
                console.warn("Login sync error:", e);
              }
              loadCustomerOrders();
              if (pendingReturnScreen) {
                const target = pendingReturnScreen;
                setPendingReturnScreen(null);
                setScreen(target);
              } else {
                setScreen("home");
              }
            }}
            onSignUp={() => setScreen("signup")}
          />
        )}
        {screen === "signup" && (
          <CustomerAuth
            mode="signup"
            isOrdering={Boolean(pendingReturnScreen)}
            onBack={() => {
              if (pendingReturnScreen) {
                const target = pendingReturnScreen;
                setPendingReturnScreen(null);
                setScreen(target);
              } else {
                setScreen("profile");
              }
            }}
            onSuccess={(user) => {
              setProfile({
                name: user.username,
                phone: user.phone || "081-234-5678",
                email: user.email || "student@kmutnb.ac.th",
                isGuest: false
              });
              if (pendingReturnScreen) {
                const target = pendingReturnScreen;
                setPendingReturnScreen(null);
                setScreen(target);
              } else {
                setScreen("home");
              }
            }}
            onLogin={() => setScreen("login")}
          />
        )}
      </div>
      {!["login", "signup", "chat"].includes(screen) && (
        <BottomNav
          tone="orange"
          active={screen === "profile" ? "profile" : ["recent", "delivery"].includes(screen) ? "order" : "home"}
          onChange={nav}
          items={[
            { key: "home", label: "หน้าแรก", icon: "⌂" },
            { key: "order", label: unreadChatCount > 0 ? `ออเดอร์ (${unreadChatCount})` : "ออเดอร์", icon: "▣" },
            { key: "profile", label: "โปรไฟล์", icon: "♙" },
            { key: "cart", label: cartCount ? `ตะกร้า (${cartCount})` : "ตะกร้า", icon: "🛒" }
          ]}
        />
      )}
      {!["login", "signup", "profile", "save-place"].includes(screen) && cartCount > 0 && (
        <button className="floating-cart-button" onClick={() => setScreen("basket")}>
          🛒 {cartCount} · {total} ฿
        </button>
      )}
      {customItem && <CustomizationModal item={customItem} options={customizationOptions[customItem.customizationType] || customizationOptions.rice} selected={customAddons} setSelected={setCustomAddons} note={customNote} setNote={setCustomNote} qty={customQty} setQty={setCustomQty} onClose={() => setCustomItem(null)} onConfirm={confirmCustomization} />}
      {showDormPicker && <DormitoryPickerModal dormList={dormList} soiList={soiList} currentDorm={currentDorm} onSelect={(dorm) => { setCurrentDorm(dorm); setShowDormPicker(false); }} onClose={() => setShowDormPicker(false)} />}
    </MobileShell>
  );
}

function CustomerHome({ search, setSearch, category, setCategory, foods, menu, featured, heroIndex, setHeroIndex, heroCount, cartCount, currentDorm, onOpenDormPicker, onStore, onCart, onOrders, onProfile }) {
  return <div className="customer-home">
    <div className="storefront-progress" aria-hidden="true" />
    <header className="storefront-nav">
      <Link className="storefront-brand" href="/customer" aria-label="Behind North หน้าแรก"><span>BN</span><b>Behind North</b></Link>
      <div className="storefront-address" onClick={onOpenDormPicker} style={{ cursor: "pointer" }}>
        <span className="address-pin">⌖</span>
        <div><small>จัดส่งถึง ({currentDorm?.soi || "ซอย 11"})</small><b>{currentDorm?.name || "S9 Residence"}</b></div>
        <span className="address-chevron">⌄</span>
      </div>
      <div className="storefront-search"><SearchBar value={search} onChange={setSearch} placeholder="ค้นหาร้านหรือเมนู" /></div>
      <nav className="storefront-links"><button onClick={onOrders}>รายการสั่งซื้อ</button><button onClick={onProfile}>บัญชีของฉัน</button></nav>
      <button className="storefront-cart" onClick={onCart}><span>ตะกร้าของฉัน</span><b>🛒</b>{cartCount > 0 && <i>{cartCount}</i>}</button>
    </header>

    {featured && (
      <section className="customer-hero" data-scroll-reveal>
        <div className="hero-copy"><span className="hero-eyebrow"><i /> อร่อยใกล้ มจพ.</span><h1>มื้อนี้<br />ให้เรา <em>จัดให้</em></h1><p>รวมร้านโปรดแถวมหาวิทยาลัย<br className="desktop-break" /> ส่งตรงถึงหอ อร่อยง่ายในไม่กี่คลิก</p><button className="hero-cta" onClick={() => featured.store && onStore(featured.store)}>สั่ง {featured.name} <span>↗</span></button><div className="hero-note"><span>✦</span> ร้านเด็ด ส่งไว เริ่มต้นเพียง 40 บาท</div></div>
        <div className="hero-photo hero-stage"><div className="hero-orbit hero-orbit-one" /><div className="hero-orbit hero-orbit-two" /><div className="hero-dish-frame" key={featured.id}><img className="hero-dish" src={featured.image} alt={featured.name} /><span className="hero-dish-glint" /></div><div className="hero-photo-label"><span>เมนูแนะนำ · {featured.storeName}</span><b>{featured.name}</b><small>ปรุงสดจากร้านใกล้คุณ <strong>฿{featured.price}</strong></small></div><div className="hero-slide-controls" aria-label="เลือกเมนูแนะนำ"><button onClick={() => setHeroIndex((heroIndex - 1 + heroCount) % heroCount)} aria-label="เมนูก่อนหน้า">‹</button>{heroMenuGallery.map((item, index) => <button key={item.id} className={index === heroIndex ? "active" : ""} onClick={() => setHeroIndex(index)} aria-label={`แสดงเมนู ${item.name}`} />)}<button onClick={() => setHeroIndex((heroIndex + 1) % heroCount)} aria-label="เมนูถัดไป">›</button></div></div>
        <div className="hero-index"><b>{String(heroIndex + 1).padStart(2, "0")}</b><span /> {String(heroCount).padStart(2, "0")}</div>
      </section>
    )}

    <section className="discovery-section" data-scroll-reveal>
      <div className="section-heading"><div><span className="section-kicker">เลือกตามใจ</span><h2>วันนี้อยากกินอะไร?</h2></div><a href="#popular">สำรวจร้านทั้งหมด <span>→</span></a></div>
      <div className="customer-categories">{categories.map((c, i) => <button className={category === c ? "active" : ""} key={c} onClick={() => setCategory(c)}><span>{["✳", "🍳", "🥓", "🍜", "🍱", "🌶️"][i] || "🍽️"}</span>{c === "All" ? "ทั้งหมด" : c}</button>)}</div>
    </section>

    <section className="discovery-section popular-section" id="popular" data-scroll-reveal><div className="section-heading"><div><span className="section-kicker">คัดมาให้แล้ว</span><h2>ร้านยอดนิยมใกล้คุณ</h2></div><a href="#popular">ดูร้านทั้งหมด <span>→</span></a></div>
      <div className="food-grid">
        {foods.map((food, index) => (
          <button className={`food-card editorial-card card-tone-${index + 1}`} data-scroll-reveal key={food.id} onClick={() => onStore(food)}>
            <StoreCardVisual food={food} index={index} />
            <div className="editorial-card-info">
              <small className="food-category">{food.category}</small>
              <b>{food.name}</b>
              <div className="food-meta">
                <span>★ {food.rating}</span>
                <i />
                <span>{food.delivery}</span>
                <strong>เริ่ม ฿{food.price}</strong>
              </div>
              <div className="shop-tag-row">
                {food.tags?.map((tag) => <small key={tag}>{tag}</small>)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>

    <section className="discovery-section menu-section" id="menu" data-scroll-reveal>
      <div className="section-heading"><div><span className="section-kicker">อร่อยทุกคำ คัดมาแล้ว</span><h2>เมนูที่น่าลอง</h2></div><span className="menu-section-note">เลื่อนลงมาเจอจานโปรดของคุณ</span></div>
      <div className="menu-gallery-grid">{menu.map((item, index) => <article className="menu-card" data-scroll-reveal key={item.id}>
        <button className="menu-photo-button" onClick={() => item.store && onStore(item.store)} aria-label={`ดูเมนูร้าน ${item.storeName}: ${item.name}`}>{item.image ? <img src={item.image} alt={item.name} loading={index < 4 ? "eager" : "lazy"} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", background: "#f8fafc" }}>{item.emoji || "🍲"}</div>}<span>↗</span></button>
        <div className="menu-card-info"><div><small>{item.storeName}</small><b>{item.name}</b></div><div className="menu-card-meta"><span>★ {item.store?.rating || 4.8}</span><b>฿{item.price}</b></div></div>
      </article>)}</div>
    </section>

    <section className="repeat-order" data-scroll-reveal><div className="repeat-icon">↻</div><div><span className="section-kicker">อยากกินอีกแล้ว</span><b>สั่งร้านเดิมอีกครั้ง</b><small>{foods[0]?.name || "ตามสั่ง by เชฟเจนนี่"} · {foods[0]?.menu?.[0]?.name || "ข้าวผัดอเมริกัน"} · 60 บาท</small></div><button onClick={() => foods[0] && onStore(foods[0])}>สั่งซ้ำ <span>→</span></button></section>
  </div>;
}

function StoreCardVisual({ food, index }) {
  const [hasError, setHasError] = useState(false);
  const isValidPhoto = food.photo && (food.photo.startsWith("http://") || food.photo.startsWith("https://")) && !hasError;

  if (isValidPhoto) {
    return (
      <div className="shop-photo">
        <img
          src={food.photo}
          alt={`${food.name} ร้านอาหาร`}
          loading={index < 2 ? "eager" : "lazy"}
          onError={() => setHasError(true)}
        />
        <span className="shop-status">เปิดอยู่</span>
        <i>↗</i>
      </div>
    );
  }

  return (
    <div className="shop-photo shop-photo-placeholder">
      <div className="placeholder-content">
        <span className="placeholder-emoji">{food.emoji || "🍽️"}</span>
        <b className="placeholder-store-title">{food.name}</b>
        <span className="placeholder-status-tag">📷 รออัปโหลดรูปหน้าร้าน</span>
      </div>
      <span className="shop-status">เปิดอยู่</span>
      <i>↗</i>
    </div>
  );
}

function StoreHeroVisual({ store }) {
  const [hasError, setHasError] = useState(false);
  const isValidPhoto = store.photo && (store.photo.startsWith("http://") || store.photo.startsWith("https://")) && !hasError;

  if (isValidPhoto) {
    return (
      <div className="store-photo-large">
        <img src={store.photo} alt={`${store.name} เมนูแนะนำ`} onError={() => setHasError(true)} />
        <span className="store-open-pill">เปิดให้บริการ</span>
      </div>
    );
  }

  return (
    <div className="store-photo-large store-photo-placeholder-banner">
      <div className="hero-placeholder-inner">
        <span className="hero-placeholder-emoji">{store.emoji || "🍽️"}</span>
        <h3>{store.name}</h3>
        <p>{store.category}</p>
        <span className="hero-placeholder-tag">📷 ภาพถ่ายหน้าร้าน (รอร้านค้าอัปโหลด)</span>
      </div>
      <span className="store-open-pill">เปิดให้บริการ</span>
    </div>
  );
}

function CustomerStore({ store, onBack, onCustomize, onBasket, cartCount }) {
  const [selectedCat, setSelectedCat] = useState("ทั้งหมด");
  const menuList = store.menu || [];

  // แยกหมวดหมู่ของเมนูที่มีอยู่ในร้านนี้จริง
  const availableCategories = useMemo(() => {
    if (!menuList.length) return ["ทั้งหมด"];
    const cats = new Set();
    menuList.forEach((it) => {
      cats.add(getMenuCategory(it, store.category));
    });
    return ["ทั้งหมด", ...Array.from(cats)];
  }, [menuList, store.category]);

  // กรองเมนูตามหมวดหมู่ที่เลือก
  const displayedMenu = useMemo(() => {
    if (selectedCat === "ทั้งหมด") return menuList;
    return menuList.filter((it) => getMenuCategory(it, store.category) === selectedCat);
  }, [menuList, selectedCat, store.category]);

  return (
    <div className="restaurant-detail">
      <TopBar
        title={store.name}
        subtitle={store.category}
        onBack={onBack}
        action={<button className="topbar-cart" onClick={onBasket}>🛒 {cartCount}</button>}
      />
      <div className="store-hero">
        <StoreHeroVisual store={store} />
        <div className="store-info">
          <div><b>{store.name}</b><small>{store.category}</small></div>
          <div className="store-meta-line">
            <span>★ {store.rating}</span><i />
            <span>{store.delivery}</span><i />
            <span>{store.fee}</span>
          </div>
          <div className="store-detail-tags">
            {store.tags?.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </div>
      </div>

      <div className="restaurant-menu-heading">
        <div>
          <small>ทำสดใหม่ทุกจาน</small>
          <b>เมนูของร้าน</b>
        </div>
        <span>{displayedMenu.length} จาก {menuList.length} เมนู</span>
      </div>

      {/* แถบเลือกหมวดหมู่เมนูอาหาร (Chips Filter) */}
      {availableCategories.length > 1 && (
        <div className="menu-category-scroll">
          {availableCategories.map((cat) => {
            const count = cat === "ทั้งหมด"
              ? menuList.length
              : menuList.filter((it) => getMenuCategory(it, store.category) === cat).length;
            return (
              <button
                key={cat}
                className={`menu-cat-chip ${selectedCat === cat ? "active" : ""}`}
                onClick={() => setSelectedCat(cat)}
              >
                {cat} <span className="chip-count">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {displayedMenu.length > 0 ? (
        <div className="store-menu-grid">
          {displayedMenu.map((item) => (
            <article className="store-menu-item" key={item.id}>
              <div className="store-menu-photo" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontSize: "32px" }}>
                {item.image ? (
                  <img src={item.image} alt={item.name} loading="lazy" />
                ) : (
                  <span>{item.emoji || "🍲"}</span>
                )}
              </div>
              <div className="store-menu-item-info">
                <div>
                  <b>{item.name}</b>
                  <small>{item.description}</small>
                </div>
                <div className="store-menu-item-bottom">
                  <strong>฿{item.price}</strong>
                  <button onClick={() => onCustomize(item, store)} aria-label={`ปรับแต่ง ${item.name}`}>＋</button>
                </div>
                <small className="customize-hint">ปรับแต่งเมนูได้</small>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "40px 16px", color: "#8a8178" }}>
          <p>ไม่มีเมนูในหมวดหมู่นี้</p>
        </div>
      )}

      <button className="primary-btn store-cart-cta" onClick={onBasket}>
        ดูตะกร้า <span>{cartCount} รายการ</span>
      </button>
    </div>
  );
}

function CustomizationModal({ item, options, selected, setSelected, note, setNote, qty, setQty, onClose, onConfirm }) {
  const addonsTotal = options.filter((option) => selected.includes(option.id)).reduce((sum, option) => sum + option.price, 0);
  const toggle = (id) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  return <div className="customize-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="customize-dialog" role="dialog" aria-modal="true" aria-labelledby="customize-title"><button className="customize-close" onClick={onClose} aria-label="ปิด">×</button><div className="customize-product">{item.image ? <img src={item.image} alt={item.name} /> : <div style={{ width: "64px", height: "64px", borderRadius: "12px", background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", flexShrink: 0 }}>{item.emoji || "🍲"}</div>}<div><small>ปรับแต่งเมนู</small><h2 id="customize-title">{item.name}</h2><span>฿{item.price}</span></div></div><div className="customize-section-heading"><b>เพิ่มความอร่อย</b><small>เลือกได้หลายรายการ</small></div><div className="customize-options">{options.map((option) => <label className="customize-option" key={option.id}><input type="checkbox" checked={selected.includes(option.id)} onChange={() => toggle(option.id)} /><span>{option.name}</span><b>+฿{option.price}</b></label>)}</div><label className="customize-note"><b>หมายเหตุถึงร้าน</b><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="เช่น ไม่ใส่ผัก เผ็ดน้อย แยกน้ำซอส" maxLength={180} /><small>{note.length}/180</small></label><div className="customize-footer"><div className="qty customize-qty"><button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button onClick={() => setQty(qty + 1)}>＋</button></div><button className="primary-btn" onClick={onConfirm}>เพิ่มลงตะกร้า · ฿{(item.price + addonsTotal) * qty}</button></div></section></div>;
}

function Basket({ cart, subtotal, deliveryFee, total, changeQty, onBack, onNext, isLoggedIn, hasAddress, savedAddress, onRequireLogin, onRequireAddress }) {
  return (
    <>
      <TopBar title="My Cart" onBack={onBack} />
      {!isLoggedIn ? (
        <div className="auth-checkout-notice">
          <div className="auth-checkout-notice-text">
            <b>🔒 กรุณาเข้าสู่ระบบก่อนสั่งซื้อ</b>
            <small>ระบบจำเป็นต้องใช้ข้อมูลผู้ใช้งานในการจัดส่งอาหาร</small>
          </div>
          <button className="auth-checkout-notice-btn" onClick={onRequireLogin}>
            เข้าสู่ระบบ
          </button>
        </div>
      ) : !hasAddress ? (
        <div className="auth-checkout-notice address-warning-notice">
          <div className="auth-checkout-notice-text">
            <b>📍 ต้องระบุที่อยู่ในโปรไฟล์ก่อนสั่งซื้อ</b>
            <small>กรุณาระบุหอพักและเลขห้องพักสำหรับจัดส่งอาหาร</small>
          </div>
          <button className="auth-checkout-notice-btn" onClick={onRequireAddress}>
            เพิ่มที่อยู่
          </button>
        </div>
      ) : (
        <div className="cart-delivery-address-chip">
          <span>📍 จัดส่งถึง: <b>{savedAddress?.dormitory?.name}</b> ห้อง {savedAddress?.roomNumber} ({savedAddress?.dormitory?.soi})</span>
          <button type="button" onClick={onRequireAddress}>แก้ไข</button>
        </div>
      )}
      <div className="cart-shop">
        <CartStoreThumb storeId={cart[0]?.storeId} />
        <div>
          <b>{cart[0]?.storeName || "เลือกร้านค้า"}</b>
          <small>Delivery · est. 34 mins</small>
        </div>
      </div>
      {cart.length ? (
        cart.map((item) => (
          <div className="cart-row" key={item.cartLineId || item.id}>
            <div className="food-thumb cart-item-image" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#fff7ed", fontSize: "24px" }}>
              {item.image ? (
                <img src={item.image} alt={item.name} />
              ) : (
                <span>{item.emoji || "🍲"}</span>
              )}
            </div>
            <div className="cart-row-info">
              <b>{item.name}</b>
              {item.selectedAddons?.length > 0 && (
                <small>เพิ่ม: {item.selectedAddons.map((option) => option.name).join(", ")}</small>
              )}
              {item.note && <small>หมายเหตุ: {item.note}</small>}
              <small>{item.price} ฿</small>
            </div>
            <div className="qty">
              <button onClick={() => changeQty(item.cartLineId || item.id, -1)}>−</button>
              <span>{item.qty}</span>
              <button onClick={() => changeQty(item.cartLineId || item.id, 1)}>＋</button>
            </div>
          </div>
        ))
      ) : (
        <EmptyState title="Your basket is empty" text="กลับไปที่ร้านเพื่อเลือกเมนู" />
      )}
      <Summary subtotal={subtotal} delivery={deliveryFee} total={total} />
      <button className="primary-btn" disabled={!cart.length} onClick={onNext}>
        ดำเนินการต่อ →
      </button>
    </>
  );
}

function UpdateBasket({ cart, total, savedPlace, setSavedPlace, changeQty, onBack, onNext, isLoggedIn, hasAddress, savedAddress, onRequireLogin, onRequireAddress }) {
  return (
    <>
      <TopBar title="Update Basket" onBack={onBack} action={<b className="orange-text">{total} ฿</b>} />
      {!isLoggedIn ? (
        <div className="auth-checkout-notice">
          <div className="auth-checkout-notice-text">
            <b>🔒 กรุณาเข้าสู่ระบบก่อนสั่งซื้อ</b>
            <small>ระบบจำเป็นต้องใช้ข้อมูลผู้ใช้งานในการจัดส่งอาหาร</small>
          </div>
          <button className="auth-checkout-notice-btn" onClick={onRequireLogin}>
            เข้าสู่ระบบ
          </button>
        </div>
      ) : !hasAddress ? (
        <div className="auth-checkout-notice address-warning-notice">
          <div className="auth-checkout-notice-text">
            <b>📍 ต้องระบุที่อยู่ในโปรไฟล์ก่อนสั่งซื้อ</b>
            <small>กรุณาระบุหอพักและเลขห้องพักสำหรับจัดส่งอาหาร</small>
          </div>
          <button className="auth-checkout-notice-btn" onClick={onRequireAddress}>
            เพิ่มที่อยู่
          </button>
        </div>
      ) : (
        <div className="cart-delivery-address-chip">
          <span>📍 จัดส่งถึง: <b>{savedAddress?.dormitory?.name}</b> ห้อง {savedAddress?.roomNumber} ({savedAddress?.dormitory?.soi})</span>
          <button type="button" onClick={onRequireAddress}>แก้ไข</button>
        </div>
      )}
      <div className="order-card">
        <div className="cart-shop">
          <CartStoreThumb storeId={cart[0]?.storeId} />
          <div>
            <b>{cart[0]?.storeName || "เลือกร้านค้า"}</b>
            <small>Delivery · est. 34 mins</small>
          </div>
        </div>
        {cart.map((item) => (
          <div className="simple-line" key={item.cartLineId || item.id}>
            <div>
              <span>{item.name}</span>
              {item.selectedAddons?.length > 0 && (
                <small className="order-custom-detail"> + {item.selectedAddons.map((option) => option.name).join(", ")}</small>
              )}
              {item.note && <small className="order-custom-detail">หมายเหตุ: {item.note}</small>}
            </div>
            <div className="qty">
              <button onClick={() => changeQty(item.cartLineId || item.id, -1)}>−</button>
              <span>{item.qty}</span>
              <button onClick={() => changeQty(item.cartLineId || item.id, 1)}>＋</button>
            </div>
          </div>
        ))}
      </div>
      <label className="check-line">
        <input type="checkbox" checked={savedPlace} onChange={(e) => setSavedPlace(e.target.checked)} /> Save my place
      </label>
      <button className="primary-btn" onClick={onNext}>
        ยืนยันรายการ → {total} ฿
      </button>
    </>
  );
}

function PlaceOrder({ cart, subtotal, deliveryFee, total, onBack, onPlace, isLoggedIn, hasAddress, savedAddress, onRequireLogin, onRequireAddress }) {
  return (
    <>
      <TopBar title="Order Summary" onBack={onBack} />
      {!isLoggedIn ? (
        <div className="auth-checkout-notice">
          <div className="auth-checkout-notice-text">
            <b>🔒 กรุณาเข้าสู่ระบบก่อนสั่งซื้อ</b>
            <small>ระบบจำเป็นต้องใช้ข้อมูลผู้ใช้งานในการจัดส่งอาหาร</small>
          </div>
          <button className="auth-checkout-notice-btn" onClick={onRequireLogin}>
            เข้าสู่ระบบ
          </button>
        </div>
      ) : !hasAddress ? (
        <div className="auth-checkout-notice address-warning-notice">
          <div className="auth-checkout-notice-text">
            <b>📍 ต้องระบุที่อยู่ในโปรไฟล์ก่อนสั่งซื้อ</b>
            <small>กรุณาระบุหอพักและเลขห้องพักสำหรับจัดส่งอาหาร</small>
          </div>
          <button className="auth-checkout-notice-btn" onClick={onRequireAddress}>
            เพิ่มที่อยู่
          </button>
        </div>
      ) : (
        <div className="cart-delivery-address-chip">
          <span>📍 จัดส่งถึง: <b>{savedAddress?.dormitory?.name}</b> ห้อง {savedAddress?.roomNumber} ({savedAddress?.dormitory?.soi})</span>
          <button type="button" onClick={onRequireAddress}>แก้ไข</button>
        </div>
      )}
      <div className="summary-card-big">
        <div className="cart-shop">
          <CartStoreThumb storeId={cart[0]?.storeId} />
          <div>
            <b>{cart[0]?.storeName || "เลือกร้านค้า"}</b>
            <small>Delivery · 34 mins</small>
          </div>
        </div>
        {cart.map((item) => (
          <div className="summary-item" key={item.cartLineId || item.id}>
            <span>
              {item.name} x{item.qty}
              {item.selectedAddons?.length > 0 && (
                <small className="order-custom-detail"> + {item.selectedAddons.map((option) => option.name).join(", ")}</small>
              )}
              {item.note && <small className="order-custom-detail">หมายเหตุ: {item.note}</small>}
            </span>
            <b>{item.price * item.qty} ฿</b>
          </div>
        ))}
        <Summary subtotal={subtotal} delivery={deliveryFee} total={total} />
      </div>
      <div className="payment-card">
        <b>Payment method</b>
        <div>◉ PromptPay QR Code <span>›</span></div>
      </div>
      <button className="primary-btn" onClick={!isLoggedIn ? onRequireLogin : !hasAddress ? onRequireAddress : onPlace}>
        {!isLoggedIn ? `เข้าสู่ระบบเพื่อสั่งซื้อ · ${total} ฿` : !hasAddress ? `ระบุที่อยู่จัดส่งก่อนสั่ง · ${total} ฿` : `ยืนยันการสั่งซื้อ · ${total} ฿`}
      </button>
    </>
  );
}

function CartStoreThumb({ storeId }) {
  const store = customerFoods.find((item) => item.id === storeId);
  const hasPhoto = store?.photo && (store.photo.startsWith("http://") || store.photo.startsWith("https://"));
  if (hasPhoto) {
    return <div className="food-thumb cart-store-image"><img src={store.photo} alt={store?.name || "ร้านอาหาร"} /></div>;
  }
  return (
    <div
      className="food-thumb cart-store-image"
      style={{
        display: "grid",
        placeItems: "center",
        fontSize: "20px",
        background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
        border: "1px solid #fed7aa",
        borderRadius: "10px"
      }}
    >
      {store?.emoji || "🍱"}
    </div>
  );
}

function Summary({ subtotal, delivery, total }) { return <div className="summary"><div><span>Subtotal</span><b>{subtotal} ฿</b></div><div><span>Delivery fee</span><b>{delivery} ฿</b></div><hr/><div className="total"><span>Total</span><strong>{total} ฿</strong></div></div>; }

function Recent({ orders, onOpen, onHome }) {
  return (
    <div style={{ paddingBottom: "140px" }}>
      <TopBar title="ประวัติการสั่งซื้อ" subtitle="Recent Orders" onBack={onHome} />
      <div className="list-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px" }}>
        <b style={{ fontSize: "16px", color: "#1e293b" }}>คำสั่งซื้อของฉัน</b>
        <span style={{ background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 700 }}>
          {orders.length} รายการ
        </span>
      </div>

      <div style={{ padding: "0 12px" }}>
        {orders.length > 0 ? (
          orders.map((order) => {
            const isCompleted = order.status === "COMPLETED";
            const isPaid = ["PAID", "PREPARING", "READY_FOR_DELIVERY", "IN_DELIVERY"].includes(order.status);
            const isCancelled = ["CANCELLED", "CANCELLED_BY_CUSTOMER", "CANCELLED_BY_TIMEOUT", "CANCELLED_BY_MERCHANT", "REJECTED_BY_MERCHANT"].includes(order.status);

            const badgeBg = isCompleted ? "#ecfdf5" : isPaid ? "#eff6ff" : isCancelled ? "#fef2f2" : "#fff7ed";
            const badgeColor = isCompleted ? "#059669" : isPaid ? "#2563eb" : isCancelled ? "#dc2626" : "#d97706";
            const badgeBorder = isCompleted ? "#a7f3d0" : isPaid ? "#bfdbfe" : isCancelled ? "#fecaca" : "#fed7aa";

            return (
              <button
                className="recent-order-row"
                key={order.id}
                onClick={() => onOpen(order)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "14px",
                  marginBottom: "10px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                  width: "100%",
                  textAlign: "left",
                  cursor: "pointer",
                  gap: "12px"
                }}
              >
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
                  {isCompleted ? "🍽️" : isCancelled ? "❌" : "🍛"}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                    <span style={{
                      background: "#f8fafc",
                      color: "#ea580c",
                      border: "1px solid #fed7aa",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: "6px",
                      letterSpacing: "0.5px"
                    }}>
                      {order.order_code || order.id}
                    </span>
                    <b style={{ fontSize: "14px", color: "#1e293b", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {order.store}
                    </b>
                  </div>
                  <small style={{ color: "#64748b", display: "block", fontSize: "12px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", margin: "2px 0" }}>
                    {Array.isArray(order.items) ? order.items.join(" · ") : order.items || "รายการอาหาร"}
                  </small>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>{order.date}</span>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <strong style={{ fontSize: "15px", color: "#1e293b", display: "block", marginBottom: "4px" }}>
                    ฿{order.total}
                  </strong>
                  <span style={{
                    display: "inline-block",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    background: badgeBg,
                    color: badgeColor,
                    border: `1px solid ${badgeBorder}`,
                    whiteSpace: "nowrap"
                  }}>
                    {statusLabel[order.status] || order.status}
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <EmptyState title="ยังไม่มีคำสั่งซื้อ" text="สั่งอาหารจานโปรดของคุณได้เลยที่หน้าแรก" />
        )}
      </div>
    </div>
  );
}

function Delivery({ order, onBack, onChat, onVerifySlip, onCancelOrder, unreadMessages = 0 }) {
  const [qrImage, setQrImage] = useState(order?.qrImage || null);
  const [slipFile, setSlipFile] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // โหลด PromptPay QR ทันทีเมื่อออเดอร์อยู่ในสถานะ PENDING_PAYMENT
  useEffect(() => {
    async function fetchQR() {
      if (order?.status === "PENDING_PAYMENT" && !qrImage && order?.rawId) {
        try {
          const res = await orderApi.getPromptPayQR(order.rawId);
          if (res?.qr_image_base64) {
            setQrImage(res.qr_image_base64);
          }
        } catch (e) {
          console.warn("Could not load QR:", e);
        }
      }
    }
    fetchQR();
  }, [order?.status, order?.rawId, qrImage]);

  const steps = ["PENDING_ACCEPT", "PENDING_PAYMENT", "PAID", "PREPARING", "READY_FOR_DELIVERY", "IN_DELIVERY", "COMPLETED"];
  const currentStep = order?.status || "PENDING_ACCEPT";
  const stepIndex = steps.indexOf(currentStep);

  return (
    <div style={{ paddingBottom: "140px" }}>
      <TopBar title={`ออเดอร์ ${order?.order_code || order?.id || "#ORD001"}`} subtitle="ติดตามสถานะจัดส่ง" onBack={onBack} />

      <div className="delivery-card" style={{ margin: "12px", padding: "16px", borderRadius: "16px", background: "white", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <b style={{ fontSize: "16px", color: "#1e293b", display: "block" }}>{order?.order_code || order?.id || "#ORD001"}</b>
            <small style={{ color: "#64748b" }}>{order?.date || "วันนี้"}</small>
          </div>
          <strong style={{ fontSize: "18px", color: "#ea580c" }}>฿{order?.total || 0}</strong>
        </div>

        {/* 1. กรณีสถานะ PENDING_ACCEPT: ต้องรอร้านค้ารับออเดอร์ก่อน ถึงจะมี QR Code */}
        {order?.status === "PENDING_ACCEPT" && (
          <div style={{
            background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
            border: "1px solid #fed7aa",
            borderRadius: "14px",
            padding: "18px 14px",
            margin: "12px 0 16px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "36px", marginBottom: "6px" }}>⏳</div>
            <b style={{ fontSize: "15px", color: "#9a3412", display: "block", marginBottom: "4px" }}>
              รอร้านค้ารับออเดอร์...
            </b>
            <p style={{ fontSize: "12px", color: "#7c2d12", margin: "0 0 12px", lineHeight: 1.5 }}>
              ร้านค้ากำลังตรวจสอบรายการอาหารของคุณ เมื่อร้านค้ารับออเดอร์แล้ว ระบบจะแสดงคิวอาร์โค้ด PromptPay สำหรับชำระเงินทันที (ไม่ต้องรีเฟรชหน้าเว็บ)
            </p>
            <button
              onClick={() => onCancelOrder && onCancelOrder(order)}
              disabled={cancelling}
              style={{
                background: "white",
                border: "1px solid #fca5a5",
                color: "#dc2626",
                borderRadius: "8px",
                padding: "7px 14px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {cancelling ? "กำลังยกเลิก..." : "ยกเลิกคำสั่งซื้อนี้"}
            </button>
          </div>
        )}

        {/* 2. กรณีสถานะ PENDING_PAYMENT: ร้านรับแล้ว แสดง QR Code PromptPay + แนบสลิป */}
        {order?.status === "PENDING_PAYMENT" && (
          <div style={{
            background: "#f0fdf4",
            border: "1.5px solid #86efac",
            borderRadius: "14px",
            padding: "16px",
            margin: "12px 0 16px",
            textAlign: "center"
          }}>
            <div style={{ display: "inline-block", background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
              ✓ ร้านค้ารับออเดอร์แล้ว! กรุณาชำระเงิน
            </div>
            <b style={{ fontSize: "15px", color: "#1e293b", display: "block", marginBottom: "2px" }}>
              สแกน QR เพื่อชำระเงิน (PromptPay)
            </b>
            <small style={{ color: "#64748b", display: "block", marginBottom: "10px" }}>
              ยอดชำระ: <strong style={{ color: "#16a34a", fontSize: "15px" }}>฿{order?.total}</strong>
            </small>

            <div style={{
              margin: "0 auto 12px",
              width: "180px",
              height: "180px",
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden"
            }}>
              {qrImage ? (
                <img src={qrImage} alt="PromptPay QR" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ) : (
                <div style={{ fontSize: "12px", color: "#64748b" }}>📱 กำลังโหลด QR Code...</div>
              )}
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label style={{
                display: "block",
                background: "white",
                border: "1px dashed #94a3b8",
                borderRadius: "8px",
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: "12px",
                color: "#334155",
                fontWeight: 600
              }}>
                {slipFile ? `📁 สลิป: ${slipFile.name}` : "📎 เลือกไฟล์รูปภาพสลิปโอนเงิน"}
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setSlipFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            <button
              onClick={() => onVerifySlip(order, slipFile)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "white",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)"
              }}
            >
              📤 แนบสลิป / ตรวจสอบสลิป (Verify Slip)
            </button>
          </div>
        )}

        {/* 3. กรณีชำระเงินแล้ว หรืออยู่ในขั้นตอนเตรียมและจัดส่ง */}
        {["PAID", "PREPARING"].includes(order?.status) && (
          <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "10px", padding: "10px", margin: "10px 0", textAlign: "center", fontSize: "12px", color: "#065f46" }}>
            ✅ ชำระเงินเรียบร้อยแล้ว · ร้านค้ากำลังเตรียมอาหาร
          </div>
        )}
        {order?.status === "READY_FOR_DELIVERY" && (
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "10px", margin: "10px 0", textAlign: "center", fontSize: "12px", color: "#1e40af" }}>
            🍲 อาหารปรุงเสร็จแล้ว · กำลังรอไรเดอร์เข้ารับ
          </div>
        )}
        {order?.status === "IN_DELIVERY" && (
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "10px", margin: "10px 0", textAlign: "center", fontSize: "12px", color: "#1e40af" }}>
            🛵 ไรเดอร์กำลังนำส่งอาหารไปยังหอพักของคุณ
          </div>
        )}
        {order?.status === "COMPLETED" && (
          <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "10px", padding: "10px", margin: "10px 0", textAlign: "center", fontSize: "12px", color: "#065f46" }}>
            🎉 จัดส่งสำเร็จเรียบร้อยแล้ว ขอบคุณที่ใช้บริการ!
          </div>
        )}
        {["CANCELLED", "CANCELLED_BY_CUSTOMER", "CANCELLED_BY_TIMEOUT", "CANCELLED_BY_MERCHANT", "REJECTED_BY_MERCHANT"].includes(order?.status) && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px", margin: "10px 0", textAlign: "center", fontSize: "12px", color: "#991b1b" }}>
            ❌ ออเดอร์นี้ถูกยกเลิกแล้ว ({statusLabel[order?.status] || "ยกเลิก"})
          </div>
        )}

        {/* Timeline steps */}
        <div style={{ marginTop: "14px" }}>
          {steps.map((st, i) => {
            const isDone = stepIndex >= i;
            const isCurrent = stepIndex === i;
            return (
              <div key={st} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0" }}>
                <div style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: isDone ? "#10b981" : "#f1f5f9",
                  color: isDone ? "white" : "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700
                }}>
                  {isDone ? "✓" : i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: "13px", color: isCurrent ? "#059669" : isDone ? "#1e293b" : "#94a3b8" }}>
                    {statusLabel[st] || st}
                  </b>
                  <small style={{ display: "block", fontSize: "11px", color: "#94a3b8" }}>
                    {isCurrent ? "สถานะปัจจุบัน" : isDone ? "เสร็จสิ้น" : "รอดำเนินการ"}
                  </small>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ข้อมูลร้านและปุ่มแชท */}
      <div style={{ margin: "0 12px 14px", background: "white", padding: "12px 14px", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
            🍛
          </div>
          <div>
            <b style={{ fontSize: "14px", color: "#1e293b" }}>{order?.store || "ร้านอาหาร"}</b>
            <small style={{ display: "block", color: "#64748b" }}>จัดส่งไปยัง: {order?.deliveryAddress || "หอพักของคุณ"}</small>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 12px" }}>
        <button
          onClick={onChat}
          style={{
            width: "100%",
            background: "#ea580c",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "12px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(234, 88, 12, 0.25)"
          }}
        >
          💬 แชทกับร้านค้า / ไรเดอร์
          {unreadMessages > 0 && (
            <span style={{ background: "white", color: "#ea580c", padding: "1px 7px", borderRadius: "10px", fontSize: "11px", fontWeight: 800 }}>
              {unreadMessages}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

function Profile({ profile, savedAddress, onBack, onManageAddress, onOrders, onLogin, onLogout }) {
  const isGuest = profile.isGuest;

  return (
    <div className="modern-profile-page">
      <TopBar title="บัญชีผู้ใช้งาน" onBack={onBack} />

      <div className="modern-profile-card">
        <div className="modern-profile-cover" />
        
        <div className="modern-profile-body">
          <div className="modern-profile-avatar-wrapper">
            <div className="modern-profile-avatar">
              {isGuest ? "👤" : "🎓"}
            </div>
          </div>

          <div className="modern-profile-identity">
            {isGuest ? (
              <>
                <h3 className="profile-guest-name">ยังไม่ได้เข้าสู่ระบบ (Guest)</h3>
                <p className="profile-guest-sub">เข้าสู่ระบบเพื่อจัดการที่อยู่จัดส่ง และดูรายการสั่งซื้อของคุณ</p>
                <button className="profile-login-action-btn" onClick={onLogin}>
                  🔑 เข้าสู่ระบบ / สมัครสมาชิก
                </button>
              </>
            ) : (
              <>
                <div className="profile-user-badge">นักศึกษา มจพ.</div>
                <h3 className="profile-user-name">{profile.name}</h3>
                <div className="profile-meta-chips">
                  <span>📞 {profile.phone || "ยังไม่ได้ระบุเบอร์"}</span>
                  <span>✉️ {profile.email || "student@kmutnb.ac.th"}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* กล่องแสดงที่อยู่จัดส่ง */}
      <div className="profile-section-card">
        <div className="section-card-header">
          <div>
            <b>📍 ที่อยู่จัดส่งของฉัน (Delivery Address)</b>
            <small>หอพักและเลขห้องสำหรับให้ไรเดอร์จัดส่งอาหาร</small>
          </div>
          <button className="section-edit-btn" onClick={profile.isGuest ? onLogin : onManageAddress}>
            {profile.isGuest ? "เข้าสู่ระบบเพื่อระบุที่อยู่" : (savedAddress?.roomNumber ? "แก้ไข" : "ระบุที่อยู่")}
          </button>
        </div>

        {profile.isGuest ? (
          <div className="profile-address-empty">
            <p>🔒 ยังไม่ได้เข้าสู่ระบบ</p>
            <small>กรุณาเข้าสู่ระบบก่อนเพื่อจัดการข้อมูลที่อยู่จัดส่งและสั่งซื้ออาหาร</small>
            <button className="btn-add-address" onClick={onLogin}>
              🔑 เข้าสู่ระบบเพื่อจัดการที่อยู่จัดส่ง
            </button>
          </div>
        ) : savedAddress?.roomNumber ? (
          <div className="profile-address-display">
            <div className="address-detail-row">
              <span className="addr-icon">🏢</span>
              <div>
                <b>{savedAddress.dormitory?.name}</b>
                <small>{savedAddress.dormitory?.soi} {savedAddress.dormitory?.location ? "· มีพิกัดแผนที่" : ""}</small>
              </div>
            </div>
            <div className="address-detail-row">
              <span className="addr-icon">🚪</span>
              <div>
                <b>เลขห้อง: {savedAddress.roomNumber}</b>
                {savedAddress.note && <small>หมายเหตุ: {savedAddress.note}</small>}
              </div>
            </div>
            {savedAddress.phone && (
              <div className="address-detail-row">
                <span className="addr-icon">📞</span>
                <div>
                  <small>เบอร์โทรผู้รับ: {savedAddress.phone}</small>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="profile-address-empty">
            <p>⚠️ ยังไม่ได้ระบุที่อยู่จัดส่ง</p>
            <small>ระบบจำเป็นต้องมีข้อมูลหอพักและเลขห้องก่อนสั่งซื้ออาหาร</small>
            <button className="btn-add-address" onClick={onManageAddress}>
              ＋ เพิ่มที่อยู่จัดส่ง (เลือกหอพัก & ระบุเลขห้อง)
            </button>
          </div>
        )}
      </div>

      {/* เมนูการทำงาน */}
      <div className="profile-menu-container">
        <button className="profile-menu-item" onClick={onOrders}>
          <div className="menu-item-left">
            <span>📦</span>
            <div>
              <b>รายการสั่งซื้อของฉัน</b>
              <small>ตรวจสอบประวัติและสถานะจัดส่ง</small>
            </div>
          </div>
          <span className="menu-chevron">›</span>
        </button>

        <button className="profile-menu-item" onClick={onManageAddress}>
          <div className="menu-item-left">
            <span>📍</span>
            <div>
              <b>จัดการที่อยู่จัดส่ง</b>
              <small>เลือกจาก 47 หอพักรอบมหาวิทยาลัย</small>
            </div>
          </div>
          <span className="menu-chevron">›</span>
        </button>

        {!isGuest && (
          <button className="profile-menu-item logout-item" onClick={onLogout}>
            <div className="menu-item-left">
              <span>↪</span>
              <div>
                <b style={{ color: "#dc2626" }}>ออกจากระบบ (Log out)</b>
                <small>ออกจากบัญชี {profile.name}</small>
              </div>
            </div>
            <span className="menu-chevron">›</span>
          </button>
        )}
      </div>
    </div>
  );
}

function SavePlace({ dormList = dormitories, soiList = sois, initialAddress, currentDorm, userPhone, onBack, onSave }) {
  const [selectedDormId, setSelectedDormId] = useState(initialAddress?.dormitory?.id || currentDorm?.id || 1);
  const [roomNumber, setRoomNumber] = useState(initialAddress?.roomNumber || "");
  const [phone, setPhone] = useState(initialAddress?.phone || userPhone || "");
  const [note, setNote] = useState(initialAddress?.note || "");
  const [searchDorm, setSearchDorm] = useState("");
  const [filterSoi, setFilterSoi] = useState("All");
  const [error, setError] = useState("");

  const filteredDorms = useMemo(() => {
    return dormList.filter(d => {
      const matchSearch = d.name.toLowerCase().includes(searchDorm.toLowerCase()) || d.soi.includes(searchDorm);
      const matchSoi = filterSoi === "All" || d.soi === filterSoi;
      return matchSearch && matchSoi;
    });
  }, [searchDorm, filterSoi]);

  const selectedDorm = dormList.find(d => d.id === Number(selectedDormId)) || dormList[0];

  function handleSave(e) {
    e.preventDefault();
    if (!roomNumber.trim()) {
      setError("กรุณาระบุเลขห้องพัก (เช่น ห้อง 304)");
      return;
    }
    if (!phone.trim()) {
      setError("กรุณาระบุเบอร์โทรศัพท์สำหรับติดต่อจัดส่ง");
      return;
    }

    onSave({
      dormitory: selectedDorm,
      roomNumber: roomNumber.trim(),
      phone: phone.trim(),
      note: note.trim()
    });
  }

  return (
    <div className="save-place-page">
      <TopBar title="ระบุที่อยู่จัดส่ง" onBack={onBack} />

      <form className="save-place-container" onSubmit={handleSave}>
        <div className="save-place-header">
          <span className="save-place-badge">📍 KMUTNB Delivery</span>
          <h2>ข้อมูลที่อยู่จัดส่ง</h2>
          <p>เลือกหอพักและระบุเลขห้อง เพื่อให้ไรเดอร์จัดส่งถึงมือคุณได้อย่างถูกต้อง</p>
        </div>

        {error && <div className="save-place-error">⚠️ {error}</div>}

        {/* 1. เลือกหอพัก */}
        <div className="address-form-group">
          <label className="address-form-label">
            <span>1. เลือกหอพักรอบ มจพ. (มี 47 หอพัก) *</span>
            <span className="selected-dorm-pill">{selectedDorm?.name} ({selectedDorm?.soi})</span>
          </label>

          <div className="dorm-search-row">
            <input
              type="text"
              placeholder="🔍 พิมพ์ค้นหาชื่อหอพัก..."
              value={searchDorm}
              onChange={(e) => setSearchDorm(e.target.value)}
              className="dorm-search-input"
            />
            <select
              value={filterSoi}
              onChange={(e) => setFilterSoi(e.target.value)}
              className="soi-select-filter"
            >
              <option value="All">ทุกซอย</option>
              {sois.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          <div className="dorm-select-list">
            {filteredDorms.map(d => (
              <button
                type="button"
                key={d.id}
                className={`dorm-list-item ${Number(selectedDormId) === d.id ? "selected" : ""}`}
                onClick={() => setSelectedDormId(d.id)}
              >
                <div>
                  <b>{d.name}</b>
                  <small>{d.soi}</small>
                </div>
                {Number(selectedDormId) === d.id ? <span className="check-icon">✓ เลือกแล้ว</span> : <span className="select-text">เลือก</span>}
              </button>
            ))}
          </div>
        </div>

        {/* 2. ระบุเลขห้อง */}
        <div className="address-form-group">
          <label className="address-form-label">2. เลขห้องพัก / ชั้น *</label>
          <input
            type="text"
            className="address-input"
            placeholder="เช่น ห้อง 304 ชั้น 3 หรือ อาคาร A ห้อง 102"
            value={roomNumber}
            onChange={(e) => {
              setRoomNumber(e.target.value);
              if (error) setError("");
            }}
            required
          />
        </div>

        {/* 3. เบอร์โทรติดต่อ */}
        <div className="address-form-group">
          <label className="address-form-label">3. เบอร์โทรศัพท์สำหรับให้ไรเดอร์ติดต่อ *</label>
          <input
            type="tel"
            className="address-input"
            placeholder="เช่น 0812345678"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (error) setError("");
            }}
            required
          />
        </div>

        {/* 4. หมายเหตุเพิ่มเติม */}
        <div className="address-form-group">
          <label className="address-form-label">4. หมายเหตุถึงผู้ส่ง (ไม่บังคับ)</label>
          <textarea
            className="address-textarea"
            placeholder="เช่น ฝากไว้ที่โต๊ะพัสดุใต้หอพัก, โทรแจ้งก่อนขึ้นไปส่ง, แขวนไว้ที่ประตูห้อง"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
        </div>

        <button type="submit" className="btn-save-address-submit">
          💾 บันทึกที่อยู่จัดส่ง
        </button>
      </form>
    </div>
  );
}

function CustomerChat({ order, storeName, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const orderId = order?.rawId || (order?.id ? Number(String(order?.id).replace(/\D/g, "")) : null);

  useEffect(() => {
    if (!orderId) return;

    async function loadChat() {
      setLoading(true);
      try {
        const hist = await orderApi.getChatHistory(orderId, "CUSTOMER");
        if (Array.isArray(hist)) {
          setMessages(hist);
          if (hist.length > 0) {
            const lastId = hist[hist.length - 1].id;
            await orderApi.markAsRead(orderId, lastId, "CUSTOMER");
          }
        }
      } catch (err) {
        console.warn("Could not fetch chat history:", err);
      } finally {
        setLoading(false);
      }
    }
    loadChat();

    const socket = getSocket("CUSTOMER");
    if (socket) {
      socket.emit("join_order_room", { orderId });

      const handleMsg = (payload) => {
        if (Number(payload.order_id || payload.orderId) === orderId) {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.id)) return prev;
            return [...prev, payload];
          });
          if (payload.id) {
            orderApi.markAsRead(orderId, payload.id, "CUSTOMER").catch(() => {});
          }
        }
      };

      socket.on("new_message", handleMsg);
      return () => {
        socket.off("new_message", handleMsg);
      };
    }
  }, [orderId]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || !orderId || sending) return;
    const sendText = text.trim();
    setText("");
    setSending(true);

    try {
      const res = await orderApi.sendMessage(orderId, sendText, "CUSTOMER");
      if (res?.data) {
        setMessages(prev => {
          if (prev.some(m => m.id === res.data.id)) return prev;
          return [...prev, res.data];
        });
      }
    } catch (err) {
      alert("ไม่สามารถส่งข้อความได้: " + err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f8fafc" }}>
      <TopBar title={`แชท: ${storeName || "ร้านค้า"}`} subtitle={`ออเดอร์ #${orderId || ""}`} onBack={onBack} />

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px 80px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", padding: "30px 0" }}>
            กำลังโหลดข้อความ...
          </div>
        ) : messages.length > 0 ? (
          messages.map((m, i) => {
            const isMe = !m.is_merchant_sender;
            return (
              <div
                key={m.id || i}
                style={{
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  maxWidth: "75%",
                  background: isMe ? "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)" : "white",
                  color: isMe ? "white" : "#1e293b",
                  padding: "10px 14px",
                  borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                  fontSize: "13px",
                  border: isMe ? "none" : "1px solid #e2e8f0",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
                }}
              >
                {!isMe && (
                  <small style={{ display: "block", color: "#64748b", fontSize: "10px", marginBottom: "2px", fontWeight: 700 }}>
                    {m.sender_sub_role === "RIDER" ? "🛵 ไรเดอร์" : "🍲 ร้านค้า"}
                  </small>
                )}
                <div>{m.content_text || m.text}</div>
                <small style={{ display: "block", textAlign: "right", fontSize: "9px", opacity: 0.8, marginTop: "4px" }}>
                  {m.created_at ? new Date(m.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : ""}
                </small>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", padding: "40px 0" }}>
            💬 ยังไม่มีข้อความสนทนา พิมพ์ทักทายร้านค้าได้เลยครับ
          </div>
        )}
      </div>

      <form
        onSubmit={handleSend}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "white",
          borderTop: "1px solid #e2e8f0",
          padding: "10px 14px",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          zIndex: 99
        }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="พิมพ์ข้อความสอบถามร้านค้า..."
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "20px",
            border: "1px solid #cbd5e1",
            fontSize: "14px",
            outline: "none"
          }}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          style={{
            background: "#ea580c",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            cursor: "pointer"
          }}
        >
          ➤
        </button>
      </form>
    </div>
  );
}

function CustomerAuth({ mode, onBack, onSuccess, onSignUp, onLogin, isOrdering }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await authApi.loginCustomer(username, password);
        onSuccess(res.user || { username });
      } else {
        const res = await authApi.registerCustomer({
          username,
          email,
          password,
          phone: phone || "0812345678"
        });
        onSuccess(res.user || { username, phone });
      }
    } catch (err) {
      const msg = err.message || "";
      if (msg === "Load failed" || msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์หลังบ้านได้ กรุณาตรวจสอบการเชื่อมต่อ Wi-Fi หรือรีเฟรชหน้าเว็บ");
      } else {
        setError(msg || "การเข้าสู่ระบบไม่สำเร็จ ตรวจสอบชื่อผู้ใช้และรหัสผ่าน");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modern-auth-container">
      <button className="modern-auth-back-btn" onClick={onBack}>
        ← กลับหน้าร้าน
      </button>

      <div className="modern-auth-card">
        {isOrdering && (
          <div className="auth-notice-banner">
            🛒 <b>จำเป็นต้องเข้าสู่ระบบก่อน</b> เพื่อระบุข้อมูลผู้สั่งซื้อและติดตามสถานะจัดส่งถึงหอพักของคุณ
          </div>
        )}

        <div className="modern-auth-header">
          <div className="brand-badge-icon">🍲 Behind NB</div>
          <h2>{mode === "login" ? "เข้าสู่ระบบ (Sign In)" : "สมัครสมาชิกใหม่ (Sign Up)"}</h2>
          <p>สั่งอาหารเดลิเวอรีหอพักรอบมหาวิทยาลัย มจพ.</p>
        </div>

        {error && <div className="modern-auth-error">⚠️ {error}</div>}

        <form className="modern-auth-form" onSubmit={handleSubmit}>
          <div className="auth-field-group">
            <label>ชื่อผู้ใช้งาน (Username หรือ Email)</label>
            <input
              type="text"
              placeholder="เช่น student หรือ student@kmutnb.ac.th"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          {mode === "signup" && (
            <>
              <div className="auth-field-group">
                <label>อีเมล (Email)</label>
                <input
                  type="email"
                  placeholder="เช่น student@kmutnb.ac.th"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="auth-field-group">
                <label>เบอร์โทรศัพท์ (สำหรับผู้จัดส่งติดต่อ)</label>
                <input
                  type="tel"
                  placeholder="เช่น 0812345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="auth-field-group">
            <label>รหัสผ่าน (Password)</label>
            <input
              type="password"
              placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          <button className="modern-auth-submit-btn" type="submit" disabled={loading}>
            {loading ? "กำลังดำเนินการ..." : (mode === "login" ? "เข้าสู่ระบบ (Sign In)" : "สร้างบัญชีใหม่ (Sign Up)")}
          </button>

          {mode === "login" && (
            <button
              type="button"
              className="auth-quick-fill-btn"
              onClick={() => {
                setUsername("student");
                setPassword("password123");
              }}
            >
              ⚡ ใช้บัญชีทดสอบ: student / password123
            </button>
          )}

          <div className="modern-auth-toggle-row">
            <span>{mode === "login" ? "ยังไม่มีบัญชีใช่ไหม?" : "มีบัญชีอยู่แล้ว?"}</span>
            <button type="button" onClick={mode === "login" ? onSignUp : onLogin}>
              {mode === "login" ? "สมัครสมาชิกใหม่ที่นี่" : "เข้าสู่ระบบที่นี่"}
            </button>
          </div>
        </form>

        <div className="social-divider">
          <span>หรือเข้าสู่ระบบด้วย</span>
        </div>

        <div className="modern-social-row">
          <button
            type="button"
            className="social-btn"
            onClick={() => alert("ระบบเข้าสู่ระบบด้วย Google อยู่ระหว่างการเชื่อมต่อใน Phase 3")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.09C3.25 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.27C.46 8.2.0 10.04.0 12s.46 3.8 1.27 5.41l4.01-3.09z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.27 6.59l4.01 3.09c.95-2.83 3.6-4.93 6.72-4.93z"/>
            </svg>
            Google
          </button>
          <button
            type="button"
            className="social-btn"
            onClick={() => alert("ระบบเข้าสู่ระบบด้วย LINE อยู่ระหว่างการเชื่อมต่อใน Phase 3")}
          >
            <span style={{ color: "#06C755", fontSize: "16px", fontWeight: "900" }}>●</span>
            LINE
          </button>
        </div>
      </div>
    </div>
  );
}

function DormitoryPickerModal({ dormList = dormitories, soiList = sois, currentDorm, onSelect, onClose }) {
  const [q, setQ] = useState("");
  const [selectedSoi, setSelectedSoi] = useState("All");

  const filteredDorms = useMemo(() => {
    return dormList.filter((d) => {
      const matchName = d.name.toLowerCase().includes(q.toLowerCase());
      const matchSoi = selectedSoi === "All" || d.soi === selectedSoi;
      return matchName && matchSoi;
    });
  }, [q, selectedSoi]);

  return (
    <div className="customize-overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="customize-dialog" role="dialog" style={{ maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
        <button className="customize-close" onClick={onClose} aria-label="ปิด">×</button>
        <div style={{ paddingBottom: "8px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>📍 เลือกหอพักสำหรับจัดส่ง</h2>
          <small style={{ color: "#718096" }}>มีข้อมูลหอพัก 47 แห่งรอบมหาวิทยาลัย มจพ.</small>
        </div>

        <input 
          placeholder="🔍 ค้นหาชื่อหอพัก..." 
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", margin: "8px 0" }}
        />

        <div style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          padding: "6px 2px 10px",
          flexShrink: 0,
          whiteSpace: "nowrap",
          scrollbarWidth: "none"
        }}>
          <button
            type="button"
            onClick={() => setSelectedSoi("All")}
            style={{
              flexShrink: 0,
              padding: "7px 14px",
              borderRadius: "20px",
              border: selectedSoi === "All" ? "none" : "1px solid #e2e8f0",
              background: selectedSoi === "All" ? "#ea580c" : "#f1f5f9",
              color: selectedSoi === "All" ? "white" : "#475569",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            ทุกซอย
          </button>
          {soiList.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedSoi(s.name)}
              style={{
                flexShrink: 0,
                padding: "7px 14px",
                borderRadius: "20px",
                border: selectedSoi === s.name ? "none" : "1px solid #e2e8f0",
                background: selectedSoi === s.name ? "#ea580c" : "#f1f5f9",
                color: selectedSoi === s.name ? "white" : "#475569",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", margin: "8px 0" }}>
          {filteredDorms.map((d) => (
            <button 
              key={d.id}
              onClick={() => onSelect(d)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 12px",
                borderRadius: "8px",
                border: currentDorm?.id === d.id ? "2px solid #ed8936" : "1px solid #edf2f7",
                background: currentDorm?.id === d.id ? "#fffaf0" : "#fff",
                cursor: "pointer",
                textAlign: "left"
              }}
            >
              <div>
                <b style={{ fontSize: "14px", display: "block" }}>{d.name}</b>
                <small style={{ color: "#718096" }}>{d.soi}</small>
              </div>
              {currentDorm?.id === d.id ? <span style={{ color: "#ed8936", fontWeight: "bold" }}>✓ เลือกอยู่</span> : <span style={{ color: "#a0aec0" }}>เลือก ›</span>}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
