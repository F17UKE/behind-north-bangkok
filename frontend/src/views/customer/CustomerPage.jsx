"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BottomNav, MobileShell, SearchBar, TopBar, EmptyState } from "../../components/AppShell";
import { customerFoods, initialOrders, statusLabel, dormitories, sois } from "../../data/mockData";
import { authApi } from "../../api/authApi";
import { merchantApi } from "../../api/merchantApi";
import { orderApi } from "../../api/orderApi";
import "./CustomerStorefront.css";

const categories = ["All", "อาหารตามสั่ง", "หมูกระทะ", "ก๋วยเตี๋ยว", "อาหารจานเดียว"];
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
  const [currentDorm, setCurrentDorm] = useState(dormitories[0]);
  const [showDormPicker, setShowDormPicker] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { from: "store", text: "สวัสดีครับ 👋" },
    { from: "me", text: "ออเดอร์ถึงไหนแล้วครับ" },
    { from: "store", text: "กำลังเตรียมอาหารให้ครับ" },
  ]);

  const [pendingReturnScreen, setPendingReturnScreen] = useState(null);

  // 1. ตรวจสอบการล็อกอินและโหลดข้อมูลที่อยู่ / ร้านค้าเมื่อเปิดหน้า
  useEffect(() => {
    const savedUser = authApi.getCurrentUser("CUSTOMER");
    if (savedUser) {
      setProfile({
        name: savedUser.username || savedUser.name || "ผู้ใช้งาน",
        phone: savedUser.phone || "081-234-5678",
        email: savedUser.email || "student@kmutnb.ac.th",
        isGuest: false
      });
      loadCustomerOrders();
    } else {
      setProfile({
        name: "",
        phone: "",
        email: "",
        isGuest: true
      });
    }

    // โหลดที่อยู่ที่เคยบันทึกไว้ใน LocalStorage
    try {
      const storedAddr = localStorage.getItem("behind_customer_address");
      if (storedAddr) {
        const parsed = JSON.parse(storedAddr);
        if (parsed?.dormitory && parsed?.roomNumber) {
          setSavedAddress(parsed);
          setSavedPlace(true);
          if (parsed.dormitory) setCurrentDorm(parsed.dormitory);
        }
      }
    } catch (e) {
      console.log("Could not load stored address:", e);
    }

    // โหลดร้านค้าจริงจาก Backend API
    loadMerchants();
  }, []);

  function hasDeliveryAddress() {
    return Boolean(savedAddress && savedAddress.dormitory && savedAddress.roomNumber && savedAddress.roomNumber.trim());
  }

  async function loadMerchants() {
    try {
      const data = await merchantApi.getMerchants();
      if (Array.isArray(data) && data.length > 0) {
        const merged = data.map((store, i) => {
          const fallback = customerFoods.find(cf => cf.id === store.id || cf.name.toLowerCase() === store.store_name.toLowerCase()) || customerFoods[i % customerFoods.length];
          const hasRealPhoto = store.store_image_url && (store.store_image_url.startsWith("http://") || store.store_image_url.startsWith("https://"));
          return {
            id: store.id,
            name: store.store_name,
            category: fallback?.category || "อาหารตามสั่ง",
            rating: fallback?.rating || 4.8,
            price: fallback?.price || 50,
            emoji: fallback?.emoji || "🍛",
            photo: hasRealPhoto ? store.store_image_url : null,
            delivery: fallback?.delivery || "20–30 นาที",
            fee: fallback?.fee || "ส่ง ฿10",
            tags: fallback?.tags || ["เปิดบริการ"],
            menu: fallback?.menu || []
          };
        });
        setStoreList(merged);
        if (merged[0]) setSelectedStore(merged[0]);
      }
    } catch (err) {
      console.log("Using local mock merchants (Backend offline or empty):", err.message);
    }
  }

  async function loadCustomerOrders() {
    try {
      const serverOrders = await orderApi.getCustomerOrders();
      if (Array.isArray(serverOrders) && serverOrders.length > 0) {
        const formatted = serverOrders.map(o => ({
          id: `#ORD${String(o.id).padStart(3, "0")}`,
          rawId: o.id,
          store: o.store_name || "ร้านอาหารหลังมอ",
          items: Array.isArray(o.items) ? o.items.map(it => `${it.name || "อาหาร"} x${it.quantity || 1}`) : ["รายการอาหาร"],
          total: parseFloat(o.total_amount || 0),
          status: o.status || "PREPARING",
          date: o.created_at ? new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Today, now"
        }));
        setOrders(formatted);
      }
    } catch (err) {
      console.log("Could not load server orders:", err.message);
    }
  }

  const cartCount = cart.reduce((s, x) => s + x.qty, 0);
  const subtotal = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const deliveryFee = subtotal ? 10 : 0;
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
          image: m.image_url || "/menu-krapao.webp",
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
      status: "PENDING_PAYMENT",
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
        const orderId = serverRes.id || serverRes.data?.id;

        if (orderId) {
          newOrder.rawId = orderId;
          newOrder.id = `#ORD${String(orderId).padStart(3, "0")}`;

          // ดึง QR Code PromptPay
          try {
            const qrRes = await orderApi.getPromptPayQR(orderId);
            if (qrRes?.qr_image_base64) {
              newOrder.qrImage = qrRes.qr_image_base64;
            }
          } catch (qrErr) {
            console.log("Could not generate PromptPay QR:", qrErr.message);
          }
        }
      }
    } catch (apiErr) {
      console.log("Create order API error, using client mode:", apiErr.message);
    }

    setOrders((current) => [newOrder, ...current]);
    setSelectedOrder(newOrder);
    setCart([]);
    setScreen("delivery");
  }

  // ยืนยันการชำระเงินและตรวจสอบสลิปผ่าน API
  async function verifySlip(order) {
    try {
      const orderId = order.rawId || 1;
      await orderApi.verifySlip(orderId, { simulated: true, amount: order.total });
      setApiNotice("✅ ตรวจสอบสลิปสำเร็จ! สถานะเปลี่ยนเป็น: ชำระเงินแล้ว");
      
      const updatedOrder = { ...order, status: "PAID" };
      setSelectedOrder(updatedOrder);
      setOrders(current => current.map(o => (o.id === order.id ? updatedOrder : o)));
      setTimeout(() => setApiNotice(""), 3500);
    } catch (err) {
      setApiNotice("⚠️ สลิปผ่านการตรวจสอบจำลองแล้ว");
      const updatedOrder = { ...order, status: "PAID" };
      setSelectedOrder(updatedOrder);
      setOrders(current => current.map(o => (o.id === order.id ? updatedOrder : o)));
      setTimeout(() => setApiNotice(""), 3500);
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
        {apiNotice && <div className="api-toast-notice">{apiNotice}</div>}

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
        {screen === "delivery" && <Delivery order={selectedOrder} onBack={() => setScreen("recent")} onChat={() => setScreen("chat")} onVerifySlip={() => verifySlip(selectedOrder)} />}
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
              setApiNotice("ออกจากระบบเรียบร้อยแล้ว");
              setTimeout(() => setApiNotice(""), 2500);
            }}
          />
        )}
        {screen === "save-place" && (
          <SavePlace
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
            onSave={(addr) => {
              setSavedAddress(addr);
              setSavedPlace(true);
              if (addr.dormitory) setCurrentDorm(addr.dormitory);
              if (addr.phone && !profile.phone) {
                setProfile(prev => ({ ...prev, phone: addr.phone }));
              }
              try {
                localStorage.setItem("behind_customer_address", JSON.stringify(addr));
              } catch (e) {}
              setApiNotice("✅ บันทึกที่อยู่จัดส่งเรียบร้อยแล้ว!");
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
        {screen === "chat" && <CustomerChat storeName={selectedOrder?.store} messages={chatMessages} value={chatText} setValue={setChatText} onSend={sendChat} onBack={() => setScreen("delivery")} />}
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
            onSuccess={(user) => {
              setProfile({
                name: user.username,
                phone: user.phone || "081-234-5678",
                email: user.email || "student@kmutnb.ac.th",
                isGuest: false
              });
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
      <BottomNav tone="orange" active={screen === "profile" ? "profile" : ["recent", "delivery"].includes(screen) ? "order" : "home"} onChange={nav} items={[{ key: "home", label: "หน้าแรก", icon: "⌂" }, { key: "order", label: "ออเดอร์", icon: "▣" }, { key: "profile", label: "โปรไฟล์", icon: "♙" }, { key: "cart", label: cartCount ? `ตะกร้า (${cartCount})` : "ตะกร้า", icon: "🛒" }]} />
      {!["login", "signup", "profile", "save-place"].includes(screen) && cartCount > 0 && (
        <button className="floating-cart-button" onClick={() => setScreen("basket")}>
          🛒 {cartCount} · {total} ฿
        </button>
      )}
      {customItem && <CustomizationModal item={customItem} options={customizationOptions[customItem.customizationType] || customizationOptions.rice} selected={customAddons} setSelected={setCustomAddons} note={customNote} setNote={setCustomNote} qty={customQty} setQty={setCustomQty} onClose={() => setCustomItem(null)} onConfirm={confirmCustomization} />}
      {showDormPicker && <DormitoryPickerModal currentDorm={currentDorm} onSelect={(dorm) => { setCurrentDorm(dorm); setShowDormPicker(false); }} onClose={() => setShowDormPicker(false)} />}
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
      <div className="customer-categories">{categories.map((c, i) => <button className={category === c ? "active" : ""} key={c} onClick={() => setCategory(c)}><span>{["✳", "🍳", "🥓", "🍜", "🍱"][i] || "🍽️"}</span>{c === "All" ? "ทั้งหมด" : c}</button>)}</div>
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
        <button className="menu-photo-button" onClick={() => item.store && onStore(item.store)} aria-label={`ดูเมนูร้าน ${item.storeName}: ${item.name}`}><img src={item.image} alt={item.name} loading={index < 4 ? "eager" : "lazy"} /><span>↗</span></button>
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
  return <div className="restaurant-detail">
    <TopBar title={store.name} subtitle={store.category} onBack={onBack} action={<button className="topbar-cart" onClick={onBasket}>🛒 {cartCount}</button>} />
    <div className="store-hero">
      <StoreHeroVisual store={store} />
      <div className="store-info">
        <div><b>{store.name}</b><small>{store.category}</small></div>
        <div className="store-meta-line"><span>★ {store.rating}</span><i /><span>{store.delivery}</span><i /><span>{store.fee}</span></div>
        <div className="store-detail-tags">{store.tags?.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </div>
    </div>
    <div className="restaurant-menu-heading"><div><small>ทำสดทุกจาน</small><b>เมนูของร้าน</b></div><span>{store.menu?.length || 0} เมนู</span></div>
    <div className="store-menu-grid">{store.menu?.map((item) => <article className="store-menu-item" key={item.id}><div className="store-menu-photo"><img src={item.image} alt={item.name} loading="lazy" /></div><div className="store-menu-item-info"><div><b>{item.name}</b><small>{item.description}</small></div><div className="store-menu-item-bottom"><strong>฿{item.price}</strong><button onClick={() => onCustomize(item, store)} aria-label={`ปรับแต่ง ${item.name}`}>＋</button></div><small className="customize-hint">ปรับแต่งเมนูได้</small></div></article>)}</div>
    <button className="primary-btn store-cart-cta" onClick={onBasket}>ดูตะกร้า <span>{cartCount} รายการ</span></button>
  </div>;
}

function CustomizationModal({ item, options, selected, setSelected, note, setNote, qty, setQty, onClose, onConfirm }) {
  const addonsTotal = options.filter((option) => selected.includes(option.id)).reduce((sum, option) => sum + option.price, 0);
  const toggle = (id) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  return <div className="customize-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="customize-dialog" role="dialog" aria-modal="true" aria-labelledby="customize-title"><button className="customize-close" onClick={onClose} aria-label="ปิด">×</button><div className="customize-product"><img src={item.image} alt={item.name} /><div><small>ปรับแต่งเมนู</small><h2 id="customize-title">{item.name}</h2><span>฿{item.price}</span></div></div><div className="customize-section-heading"><b>เพิ่มความอร่อย</b><small>เลือกได้หลายรายการ</small></div><div className="customize-options">{options.map((option) => <label className="customize-option" key={option.id}><input type="checkbox" checked={selected.includes(option.id)} onChange={() => toggle(option.id)} /><span>{option.name}</span><b>+฿{option.price}</b></label>)}</div><label className="customize-note"><b>หมายเหตุถึงร้าน</b><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="เช่น ไม่ใส่ผัก เผ็ดน้อย แยกน้ำซอส" maxLength={180} /><small>{note.length}/180</small></label><div className="customize-footer"><div className="qty customize-qty"><button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button onClick={() => setQty(qty + 1)}>＋</button></div><button className="primary-btn" onClick={onConfirm}>เพิ่มลงตะกร้า · ฿{(item.price + addonsTotal) * qty}</button></div></section></div>;
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
            <div className="food-thumb cart-item-image">
              <img src={item.image} alt={item.name} />
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
  return <><TopBar title="Recent" onBack={onHome} /><div className="list-title"><b>Recent Orders</b><span>{orders.length}</span></div>{orders.map((order) => <button className="recent-order-row" key={order.id} onClick={() => onOpen(order)}><div className="food-thumb">{order.status === "COMPLETED" ? "🍽️" : "🍛"}</div><div className="recent-main"><b>{order.store}</b><small>{order.items?.join(" · ")}</small><span>{order.date}</span></div><div className="recent-right"><b>{order.total} ฿</b><small className={order.status === "COMPLETED" ? "green-text" : order.status === "PAID" ? "blue-text" : "orange-text"}>{statusLabel[order.status] || order.status}</small></div></button>)}</>;
}

function Delivery({ order, onBack, onChat, onVerifySlip }) {
  const steps = ["PENDING_PAYMENT", "PAID", "PREPARING", "READY_FOR_DELIVERY", "IN_DELIVERY", "COMPLETED"];
  const currentStep = order?.status === "PENDING_ACCEPT" ? "PAID" : (order?.status || "PENDING_PAYMENT");
  const index = Math.max(0, steps.indexOf(currentStep));

  return <><TopBar title={`Order ${order?.id || "#ORD001"}`} onBack={onBack} action={<button className="topbar-btn">⋮</button>} />
    <div className="delivery-card">
      <div className="delivery-order-head">
        <div><b>Order {order?.id || "#ORD001"}</b><small>{order?.date || "Today, now"}</small></div>
        <strong>{order?.total || 90} ฿</strong>
      </div>

      {/* ถ้าอยู่ในสถานะรอชำระเงิน และมี PromptPay QR ให้แสดง QR ให้สแกน */}
      {order?.status === "PENDING_PAYMENT" && (
        <div className="qr-payment-card" style={{ textAlign: "center", padding: "16px", background: "#f8f9fa", borderRadius: "12px", margin: "12px 0" }}>
          <b>สแกน QR เพื่อชำระเงิน (PromptPay)</b>
          <div style={{ margin: "10px auto", width: "180px", height: "180px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #ccc", borderRadius: "8px" }}>
            {order.qrImage ? (
              <img src={order.qrImage} alt="PromptPay QR" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <div style={{ fontSize: "13px", color: "#666" }}>📱 พร้อมเพย์ QR ฿{order?.total}</div>
            )}
          </div>
          <button className="primary-btn" style={{ marginTop: "8px", width: "100%" }} onClick={onVerifySlip}>
            📤 แนบสลิป / ตรวจสอบสลิป (Verify Slip)
          </button>
        </div>
      )}

      {steps.map((step, i) => <div className={`delivery-step ${i <= index ? "done" : ""}`} key={step}><div className="step-dot">{i <= index ? "✓" : "•"}</div><div><b>{statusLabel[step] || step}</b><small>{i === index ? "Current status" : i < index ? "Completed" : "Waiting"}</small></div></div>)}
    </div>
    <div className="restaurant-line"><div className="food-thumb">🍛</div><div><b>{order?.store || "ครัวหลังมอ"}</b><small>ร้านอาหาร · 34 mins</small></div><span>⭐ 4.8</span></div>
    <button className="secondary-btn" onClick={onChat}>Chat with Restaurant</button>
  </>;
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
          <button className="section-edit-btn" onClick={onManageAddress}>
            {savedAddress?.roomNumber ? "แก้ไข" : "ระบุที่อยู่"}
          </button>
        </div>

        {savedAddress?.roomNumber ? (
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

function SavePlace({ initialAddress, currentDorm, userPhone, onBack, onSave }) {
  const [selectedDormId, setSelectedDormId] = useState(initialAddress?.dormitory?.id || currentDorm?.id || 1);
  const [roomNumber, setRoomNumber] = useState(initialAddress?.roomNumber || "");
  const [phone, setPhone] = useState(initialAddress?.phone || userPhone || "");
  const [note, setNote] = useState(initialAddress?.note || "");
  const [searchDorm, setSearchDorm] = useState("");
  const [filterSoi, setFilterSoi] = useState("All");
  const [error, setError] = useState("");

  const filteredDorms = useMemo(() => {
    return dormitories.filter(d => {
      const matchSearch = d.name.toLowerCase().includes(searchDorm.toLowerCase()) || d.soi.includes(searchDorm);
      const matchSoi = filterSoi === "All" || d.soi === filterSoi;
      return matchSearch && matchSoi;
    });
  }, [searchDorm, filterSoi]);

  const selectedDorm = dormitories.find(d => d.id === Number(selectedDormId)) || dormitories[0];

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

function CustomerChat({ storeName, messages, value, setValue, onSend, onBack }) {
  return <><div className="chat-top"><button onClick={onBack}>‹</button><div><b>{storeName || "ครัวหลังมอ"}</b><small>online</small></div><span>☎</span></div><div className="chat-messages">{messages.map((m,i)=><div className={`chat-bubble ${m.from === "me" ? "me" : "store"}`} key={i}>{m.text}</div>)}</div><form className="chat-compose" onSubmit={onSend}><input value={value} onChange={(e)=>setValue(e.target.value)} placeholder="เขียนข้อความ..."/><button>➤</button></form></>;
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
      setError(err.message || "การเข้าสู่ระบบไม่สำเร็จ ตรวจสอบชื่อผู้ใช้และรหัสผ่าน");
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

function DormitoryPickerModal({ currentDorm, onSelect, onClose }) {
  const [q, setQ] = useState("");
  const [selectedSoi, setSelectedSoi] = useState("All");

  const filteredDorms = useMemo(() => {
    return dormitories.filter((d) => {
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

        <div className="filter-scroll" style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "8px" }}>
          <button className={selectedSoi === "All" ? "active" : ""} onClick={() => setSelectedSoi("All")}>ทุกซอย</button>
          {sois.map((s) => (
            <button key={s.id} className={selectedSoi === s.name ? "active" : ""} onClick={() => setSelectedSoi(s.name)}>
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
