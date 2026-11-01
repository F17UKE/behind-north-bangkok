"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import Link from "next/link";
import { BottomNav, MobileShell, SearchBar, TopBar, EmptyState } from "../../components/AppShell";
import { statusLabel, statusTone } from "../../data/orderStatus";
import { apiData, apiRequest, clearAuthSession, getApiBaseUrl, getAuthSession, setAuthSession } from "../../api/axiosInstance";
import "./CustomerStorefront.css";

const categories = ["All", "Coffee & Tea", "On Order", "More"];
const getSocketUrl = () => {
  const apiUrl = getApiBaseUrl();
  if (apiUrl.startsWith("/")) return `${window.location.protocol}//${window.location.hostname}:5000`;
  return apiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
};
const toChatMessage = (message) => ({ id: message.id, from: message.is_merchant_sender ? "store" : "me", text: message.content_text });
async function markChatRead(orderId, messages) {
  const latestMessageId = Math.max(0, ...messages.map((message) => Number(message.id) || 0));
  if (latestMessageId) await apiRequest(`/orders/${orderId}/messages/read`, { method: "PUT", body: { message_id: latestMessageId } });
  return latestMessageId;
}

function mapMenuItem(item, store) {
  return {
    id: Number(item.id),
    name: item.name,
    price: Number(item.price),
    image: item.image_url || "",
    description: item.description || "",
    available: item.is_available !== false,
    storeId: Number(store.id),
    storeName: store.store_name,
    store,
  };
}

function mapOrder(order) {
  return {
    id: order.order_code,
    orderId: Number(order.id),
    storeId: Number(order.merchant_id),
    store: order.store_name,
    total: Number(order.total_amount),
    status: order.status,
    unreadMessageCount: Number(order.unread_message_count || 0),
    date: new Date(order.created_at).toLocaleString("th-TH"),
    items: (order.items || []).map((item) => `${item.menu_name || "เมนู"} ×${item.quantity}`),
    raw: order,
  };
}

export default function CustomerPage() {
  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [screen, setScreen] = useState("home");
  const [selectedStore, setSelectedStore] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [heroIndex, setHeroIndex] = useState(0);
  const [cart, setCart] = useState([]);
  const [checkoutMerchantId, setCheckoutMerchantId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [chatReturnScreen, setChatReturnScreen] = useState("delivery");
  const [addressReturnScreen, setAddressReturnScreen] = useState("profile");
  const [authReturnScreen, setAuthReturnScreen] = useState("home");
  const [profile, setProfile] = useState(null);
  const [authSession, setAuthSessionState] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [dormitories, setDormitories] = useState([]);
  const [actionError, setActionError] = useState("");
  const [chatText, setChatText] = useState("");
  const [customItem, setCustomItem] = useState(null);
  const [customAddons, setCustomAddons] = useState([]);
  const [customNote, setCustomNote] = useState("");
  const [customQty, setCustomQty] = useState(1);
  const [chatMessages, setChatMessages] = useState([]);
  const lastReadChatMessageId = useRef(0);

  const menuGallery = useMemo(() => stores.flatMap((store) => store.menu.map((item) => ({ ...item, storeName: store.name, store }))), [stores]);
  const heroMenuGallery = menuGallery.slice(0, 10);
  const featured = heroMenuGallery.length ? heroMenuGallery[heroIndex % heroMenuGallery.length] : null;
  const savedPlace = Boolean(profile?.dormitory_id);

  useEffect(() => {
    let cancelled = false;
    async function loadStores() {
      setStoresLoading(true);
      setLoadError("");
      try {
        const merchantRows = apiData(await apiRequest("/merchants"));
        const nextStores = await Promise.all(merchantRows.map(async (merchant) => {
          const menuRows = apiData(await apiRequest(`/merchants/${merchant.id}/menu`));
          const store = {
            id: Number(merchant.id),
            name: merchant.store_name,
            category: merchant.category || "ร้านอาหาร",
            photo: merchant.store_image_url || "",
            delivery: "ค่าส่งตามพื้นที่",
            fee: "คำนวณจากที่อยู่จัดส่ง",
            tags: [],
            rating: null,
          };
          return { ...store, menu: menuRows.map((item) => mapMenuItem(item, { ...merchant, ...store })) };
        }));
        if (!cancelled) setStores(nextStores);
      } catch (error) {
        if (!cancelled) setLoadError(error.message);
      } finally {
        if (!cancelled) setStoresLoading(false);
      }
    }
    loadStores();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const syncSession = () => setAuthSessionState(getAuthSession());
    syncSession();
    window.addEventListener("storage", syncSession);
    window.addEventListener("behind-nb-auth-changed", syncSession);
    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("behind-nb-auth-changed", syncSession);
    };
  }, []);

  useEffect(() => {
    if (authSession?.role !== "CUSTOMER") {
      const timer = window.setTimeout(() => { setOrders([]); setProfile(null); }, 0);
      return () => window.clearTimeout(timer);
    }
    let cancelled = false;
    Promise.all([apiRequest("/users/me"), apiRequest("/orders")]).then(([profileResponse, orderResponse]) => {
      if (cancelled) return;
      const nextProfile = profileResponse.profile;
      setProfile(nextProfile);
      const nextOrders = apiData(orderResponse).map(mapOrder);
      setOrders(nextOrders);
      setSelectedOrder((current) => nextOrders.find((order) => order.orderId === current?.orderId) || nextOrders[0] || null);
    }).catch((error) => { if (!cancelled) setActionError(error.message); });
    return () => { cancelled = true; };
  }, [authSession]);

  useEffect(() => {
    if (authSession?.role !== "CUSTOMER" || !authSession.token) return undefined;
    const socket = io(getSocketUrl(), { auth: { token: authSession.token } });
    const handleNewChatMessage = async ({ orderId }) => {
      try {
        const refreshedOrders = apiData(await apiRequest("/orders")).map(mapOrder);
        setOrders(refreshedOrders);
        if (screen !== "chat" || Number(selectedOrder?.orderId) !== Number(orderId)) return;
        const nextMessages = apiData(await apiRequest(`/orders/${orderId}/messages`)) || [];
        setChatMessages(nextMessages.map(toChatMessage));
        lastReadChatMessageId.current = Math.max(lastReadChatMessageId.current, await markChatRead(orderId, nextMessages));
        setOrders((current) => current.map((order) => order.orderId === Number(orderId) ? { ...order, unreadMessageCount: 0 } : order));
        setSelectedOrder((current) => current?.orderId === Number(orderId) ? { ...current, unreadMessageCount: 0 } : current);
      } catch (error) { setActionError(error.message); }
    };
    socket.on("NEW_CHAT_MESSAGE", handleNewChatMessage);
    return () => {
      socket.off("NEW_CHAT_MESSAGE", handleNewChatMessage);
      socket.disconnect();
    };
  }, [authSession?.role, authSession?.token, screen, selectedOrder?.orderId]);

  useEffect(() => {
    if (screen !== "delivery" || authSession?.role !== "CUSTOMER") return undefined;
    const refreshCurrentOrder = async () => {
      try {
        const rows = apiData(await apiRequest("/orders")).map(mapOrder);
        setOrders(rows);
        setSelectedOrder((current) => rows.find((order) => order.orderId === current?.orderId) || current);
      } catch (error) { setActionError(error.message); }
    };
    const timer = window.setInterval(refreshCurrentOrder, 8000);
    return () => window.clearInterval(timer);
  }, [screen, authSession]);

  const cartCount = cart.reduce((s, x) => s + x.qty, 0);
  const unreadMessageTotal = orders.reduce((sum, order) => sum + Number(order.unreadMessageCount || 0), 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const activeCheckoutMerchantId = cart.some((item) => String(item.storeId) === String(checkoutMerchantId)) ? checkoutMerchantId : cart[0]?.storeId ?? null;
  const checkoutCart = cart.filter((item) => String(item.storeId) === String(activeCheckoutMerchantId));
  const subtotal = checkoutCart.reduce((s, x) => s + x.price * x.qty, 0);
  const total = subtotal + deliveryFee;

  const filtered = useMemo(() => stores.filter((food) => {
    const query = search.trim().toLocaleLowerCase();
    const searchText = [food.name, food.category, ...food.menu.flatMap((item) => [item.name, item.description])].join(" ").toLocaleLowerCase();
    const matchesSearch = !query || searchText.includes(query);
    const matchesCategory = category === "All" || (category === "Coffee & Tea" && /เครื่องดื่ม|กาแฟ|คาเฟ่/.test(food.category)) || (category === "On Order" && orders.some((order) => order.storeId === food.id)) || (category === "More" && !/เครื่องดื่ม|กาแฟ|คาเฟ่/.test(food.category));
    return matchesSearch && matchesCategory;
  }), [search, category, stores, orders]);
  const filteredMenu = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const matchingStoreIds = new Set(filtered.map((store) => store.id));
    return menuGallery.filter((item) => matchingStoreIds.has(item.storeId) && (!query || `${item.name} ${item.description} ${item.storeName} ${item.store?.category || ""}`.toLocaleLowerCase().includes(query)));
  }, [filtered, menuGallery, search]);

  useEffect(() => {
    const merchantId = activeCheckoutMerchantId;
    const dormitoryId = profile?.dormitory_id;
    if (!merchantId || !dormitoryId) {
      const timer = window.setTimeout(() => setDeliveryFee(0), 0);
      return () => window.clearTimeout(timer);
    }
    let cancelled = false;
    apiRequest(`/merchants/${merchantId}/delivery-fee?dormitory_id=${dormitoryId}`)
      .then((response) => { if (!cancelled) setDeliveryFee(Number(apiData(response).delivery_fee) || 0); })
      .catch((error) => { if (!cancelled) setActionError(error.message); });
    return () => { cancelled = true; };
  }, [cart, activeCheckoutMerchantId, profile?.dormitory_id]);

  useEffect(() => {
    if (["update", "place"].includes(screen) && !checkoutCart.length) setScreen("basket");
  }, [screen, checkoutCart.length]);

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
    if (screen !== "home" || !heroMenuGallery.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => setHeroIndex((index) => (index + 1) % heroMenuGallery.length), 5200);
    return () => window.clearInterval(timer);
  }, [screen, heroMenuGallery.length]);

  useEffect(() => {
    if (screen !== "chat" || !selectedOrder?.orderId || authSession?.role !== "CUSTOMER") return undefined;
    let cancelled = false;
    apiRequest(`/orders/${selectedOrder.orderId}/messages`)
      .then(async (messages) => {
        if (!cancelled) {
          setChatMessages(messages.map(toChatMessage));
          lastReadChatMessageId.current = Math.max(lastReadChatMessageId.current, await markChatRead(selectedOrder.orderId, messages));
          setOrders((current) => current.map((order) => order.orderId === selectedOrder.orderId ? { ...order, unreadMessageCount: 0 } : order));
          setSelectedOrder((current) => current?.orderId === selectedOrder.orderId ? { ...current, unreadMessageCount: 0 } : current);
        }
      })
      .catch((error) => { if (!cancelled) setActionError(error.message); });
    return () => { cancelled = true; };
  }, [screen, selectedOrder?.orderId, authSession]);

  useEffect(() => {
    lastReadChatMessageId.current = 0;
  }, [selectedOrder?.orderId]);

  useEffect(() => {
    if (screen !== "chat" || authSession?.role !== "CUSTOMER" || !selectedOrder?.orderId) return undefined;
    let cancelled = false;
    const syncChat = async () => {
      try {
        const nextMessages = apiData(await apiRequest(`/orders/${selectedOrder.orderId}/messages`)) || [];
        if (cancelled) return;
        setChatMessages(nextMessages.map(toChatMessage));
        const latestId = Math.max(0, ...nextMessages.map((message) => Number(message.id) || 0));
        if (latestId > lastReadChatMessageId.current) {
          lastReadChatMessageId.current = Math.max(lastReadChatMessageId.current, await markChatRead(selectedOrder.orderId, nextMessages));
          if (!cancelled) {
            setOrders((current) => current.map((order) => order.orderId === selectedOrder.orderId ? { ...order, unreadMessageCount: 0 } : order));
            setSelectedOrder((current) => current?.orderId === selectedOrder.orderId ? { ...current, unreadMessageCount: 0 } : current);
          }
        }
      } catch (error) { if (!cancelled) setActionError(error.message); }
    };
    const timer = window.setInterval(syncChat, 5000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [screen, authSession?.role, selectedOrder?.orderId]);

  useEffect(() => {
    if (screen !== "recent" || authSession?.role !== "CUSTOMER") return undefined;
    let cancelled = false;
    const refreshUnreadCounts = async () => {
      try {
        const nextOrders = apiData(await apiRequest("/orders")).map(mapOrder);
        if (!cancelled) setOrders(nextOrders);
      } catch (error) { if (!cancelled) setActionError(error.message); }
    };
    const timer = window.setInterval(refreshUnreadCounts, 10000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [screen, authSession?.role]);

  useEffect(() => {
    if (screen !== "save-place") return undefined;
    let cancelled = false;
    apiRequest("/dormitories").then((response) => {
      if (!cancelled) setDormitories(apiData(response));
    }).catch((error) => { if (!cancelled) setActionError(error.message); });
    return () => { cancelled = true; };
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

  async function openCustomization(item, store) {
    try {
      const detail = apiData(await apiRequest(`/menus/${item.id}`));
      const groups = detail.option_groups || [];
      const initialChoices = groups.filter((group) => group.is_required && !group.allow_multiple).map((group) => group.choices?.[0]?.id).filter(Boolean);
      setCustomItem({ ...item, ...detail, storeId: store.id, storeName: store.name, option_groups: groups });
      setCustomAddons(initialChoices);
    } catch (error) {
      setActionError(error.message);
      return;
    }
    setCustomNote("");
    setCustomQty(1);
  }

  function confirmCustomization() {
    if (!customItem) return;
    const options = (customItem.option_groups || []).flatMap((group) => group.choices || []);
    const selected = options.filter((option) => customAddons.includes(option.id));
    const price = Number(customItem.price) + selected.reduce((sum, option) => sum + Number(option.extra_price), 0);
    const cartLineId = `${customItem.id}:${customAddons.slice().sort().join(",")}:${customNote.trim()}`;
    addItem({ ...customItem, id: Number(customItem.id), basePrice: Number(customItem.price), price, choices: customAddons.map(Number), selectedAddons: selected.map((option) => ({ ...option, price: Number(option.extra_price) })), note: customNote.trim(), cartLineId, qty: customQty });
    setCustomItem(null);
  }

  async function placeOrder() {
    if (authSession?.role !== "CUSTOMER") { setAuthReturnScreen("place"); setScreen("login"); return; }
    if (!profile?.dormitory_id || !profile?.room_number) { openAddress("place"); return; }
    if (!checkoutCart.length || checkoutCart.some((item) => String(item.storeId) !== String(activeCheckoutMerchantId))) return;
    setActionError("");
    try {
      await apiRequest("/orders", {
        method: "POST",
        body: {
          merchantId: Number(activeCheckoutMerchantId),
          dormitoryId: Number(profile.dormitory_id),
          roomNumber: profile.room_number,
          items: checkoutCart.map((item) => ({ menu_item_id: Number(item.id), quantity: Number(item.qty), note: item.note || "", choices: item.choices || [] })),
        },
      });
      const refreshed = apiData(await apiRequest("/orders")).map(mapOrder);
      setOrders(refreshed);
      setSelectedOrder(refreshed[0] || null);
      const remainingCart = cart.filter((item) => String(item.storeId) !== String(activeCheckoutMerchantId));
      setCart(remainingCart);
      setCheckoutMerchantId(remainingCart[0]?.storeId ?? null);
      setScreen("recent");
    } catch (error) {
      setActionError(error.message);
    }
  }

  async function sendChat(e) {
    e?.preventDefault();
    if (!chatText.trim() || !selectedOrder?.orderId) return;
    try {
      const response = await apiRequest(`/orders/${selectedOrder.orderId}/messages`, { method: "POST", body: { contentText: chatText.trim(), messageType: "TEXT" } });
      const message = apiData(response);
      setChatMessages((current) => [...current, { id: message.id, from: "me", text: message.content_text }]);
      lastReadChatMessageId.current = Math.max(lastReadChatMessageId.current, await markChatRead(selectedOrder.orderId, [message]));
      setOrders((current) => current.map((order) => order.orderId === selectedOrder.orderId ? { ...order, unreadMessageCount: 0 } : order));
      setSelectedOrder((current) => current?.orderId === selectedOrder.orderId ? { ...current, unreadMessageCount: 0 } : current);
    } catch (error) {
      setActionError(error.message);
      return;
    }
    setChatText("");
  }

  async function savePlace(place) {
    try {
      const result = await apiRequest("/users/me", { method: "PATCH", body: { dormitory_id: Number(place.dormitory_id), room_number: place.room_number, phone: place.phone } });
      setProfile(result.profile);
      setScreen(addressReturnScreen);
    } catch (error) {
      setActionError(error.message);
    }
  }

  async function saveProfile(nextProfile) {
    try {
      const result = await apiRequest("/users/me", { method: "PATCH", body: { username: nextProfile.username, phone: nextProfile.phone, room_number: nextProfile.room_number, dormitory_id: nextProfile.dormitory_id } });
      setProfile(result.profile);
    } catch (error) {
      setActionError(error.message);
    }
  }

  async function authenticate({ mode, email, password, name }) {
    try {
      let result;
      if (mode === "signup") {
        const username = (email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 24) || "customer").padEnd(3, "0");
        result = await apiRequest("/auth/customer/register", { method: "POST", body: { username, email, password } });
      } else {
        result = await apiRequest("/auth/customer/login", { method: "POST", body: { username: email, password } });
      }
      setAuthSession({ token: result.token, role: "CUSTOMER", user: result.user });
      setAuthSessionState(getAuthSession());
      setScreen(authReturnScreen);
      setAuthReturnScreen("home");
      return "";
    } catch (error) {
      return error.message || `เข้าสู่ระบบไม่สำเร็จ${name ? ` (${name})` : ""}`;
    }
  }

  const nav = (key) => {
    if (key === "order") { setAuthReturnScreen("recent"); setScreen(authSession?.role === "CUSTOMER" ? "recent" : "login"); }
    else if (key === "profile") setScreen("profile");
    else if (key === "cart") setScreen("basket");
    else setScreen("home");
  };

  function openStore(store) {
    setSelectedStore(store);
    setScreen("store");
  }

  function openOrderChat(order, returnScreen = "recent") {
    setSelectedOrder(order);
    setChatReturnScreen(returnScreen);
    setScreen("chat");
  }

  function openAddress(returnScreen = "home") {
    setAddressReturnScreen(returnScreen);
    if (authSession?.role === "CUSTOMER") {
      setScreen("save-place");
      return;
    }
    setAuthReturnScreen("save-place");
    setScreen("login");
  }

  return (
    <MobileShell>
      <div key={screen} className="mobile-page customer-page-shell screen-enter">
        {actionError && <div className="api-error" role="alert"><span>{actionError}</span><button onClick={() => setActionError("")} aria-label="ปิด">×</button></div>}
        {screen === "home" && (storesLoading ? <EmptyState title="กำลังโหลดร้านค้า" text="กำลังดึงร้านและเมนูจากระบบ" /> : featured ? <CustomerHome search={search} setSearch={setSearch} searchActive={Boolean(search.trim())} category={category} setCategory={setCategory} foods={filtered} menu={filteredMenu} heroMenuGallery={heroMenuGallery} featured={featured} heroIndex={heroIndex % heroMenuGallery.length} setHeroIndex={setHeroIndex} heroCount={heroMenuGallery.length} cartCount={cartCount} addressLabel={authSession?.role === "CUSTOMER" && profile?.dormitory_id ? `${profile.dormitory_name} · ห้อง ${profile.room_number || "—"}` : authSession?.role === "CUSTOMER" ? "เลือกที่อยู่จัดส่ง" : "เข้าสู่ระบบเพื่อเลือกที่อยู่"} onAddress={() => openAddress("home")} onStore={openStore} onCart={() => setScreen("basket")} onOrders={() => { setAuthReturnScreen("recent"); setScreen(authSession?.role === "CUSTOMER" ? "recent" : "login"); }} onProfile={() => setScreen("profile")} /> : <EmptyState title="ยังไม่มีร้านที่เปิดให้บริการ" text={loadError || "ร้านที่อนุมัติและเปิดให้บริการจะแสดงที่นี่"} />)}
        {screen === "store" && <CustomerStore store={selectedStore} cartCount={cartCount} onBack={() => setScreen("home")} onCustomize={openCustomization} onBasket={() => setScreen("basket")} />}
        {screen === "basket" && <Basket cart={cart} changeQty={changeQty} onBack={() => setScreen("home")} onNext={(merchantId) => { setCheckoutMerchantId(merchantId); setScreen("update"); }} />}
        {screen === "update" && <UpdateBasket cart={checkoutCart} total={total} profile={profile} onEditAddress={() => openAddress("update")} changeQty={changeQty} onBack={() => setScreen("basket")} onNext={() => { if (authSession?.role !== "CUSTOMER") { setAuthReturnScreen("update"); setScreen("login"); } else if (!profile?.dormitory_id || !profile?.room_number) openAddress("update"); else setScreen("place"); }} />}
        {screen === "place" && <PlaceOrder cart={checkoutCart} profile={profile} subtotal={subtotal} deliveryFee={deliveryFee} total={total} onBack={() => setScreen("update")} onPlace={placeOrder} />}
        {screen === "recent" && <Recent orders={orders} onOpen={(order) => { setSelectedOrder(order); setScreen("delivery"); }} onChat={(order) => openOrderChat(order, "recent")} onHome={() => setScreen("home")} />}
        {screen === "delivery" && <Delivery order={selectedOrder} onBack={() => setScreen("recent")} onChat={() => openOrderChat(selectedOrder, "delivery")} onPaid={async () => { const rows = apiData(await apiRequest("/orders")).map(mapOrder); setOrders(rows); setSelectedOrder(rows.find((order) => order.orderId === selectedOrder?.orderId) || rows[0] || null); }} />}
        {screen === "profile" && <Profile key={`${profile?.id || "guest"}-${profile?.username || ""}-${profile?.phone || ""}`} profile={profile} savedPlace={savedPlace} signedIn={authSession?.role === "CUSTOMER"} onBack={() => setScreen("home")} onSave={() => openAddress("profile")} onLogin={() => { setAuthReturnScreen("profile"); setScreen("login"); }} onLogout={() => { clearAuthSession(); setAuthSessionState(null); setProfile(null); }} onUpdateProfile={saveProfile} />}
        {screen === "save-place" && <SavePlace key={`${profile?.id || "customer"}-${profile?.dormitory_id || "new"}`} profile={profile} dormitories={dormitories} onBack={() => setScreen(addressReturnScreen)} onSave={savePlace} />}
        {screen === "chat" && <CustomerChat storeName={selectedOrder?.store} messages={chatMessages} value={chatText} setValue={setChatText} onSend={sendChat} onBack={() => setScreen(chatReturnScreen)} />}
        {screen === "login" && <CustomerAuth mode="login" onBack={() => { setAuthReturnScreen("home"); setScreen("profile"); }} onSubmit={authenticate} onSignUp={() => setScreen("signup")} />}
        {screen === "signup" && <CustomerAuth mode="signup" onBack={() => { setAuthReturnScreen("home"); setScreen("profile"); }} onSubmit={authenticate} onLogin={() => setScreen("login")} />}
      </div>
      <BottomNav tone="orange" active={screen === "profile" ? "profile" : ["recent", "delivery"].includes(screen) ? "order" : ["basket", "update", "place"].includes(screen) ? "cart" : "home"} onChange={nav} items={[{ key: "home", label: "หน้าแรก", icon: "⌂" }, { key: "order", label: "ออเดอร์", icon: "▣", badge: unreadMessageTotal }, { key: "profile", label: "โปรไฟล์", icon: "♙" }, { key: "cart", label: cartCount ? `ตะกร้า (${cartCount})` : "ตะกร้า", icon: "🛒" }]} />
      {screen === "store" && <button className="floating-cart-button" onClick={() => setScreen("basket")}>🛒 {cartCount ? `${cartCount} · ${cartSubtotal} ฿` : "0 ฿"}</button>}
      {customItem && <CustomizationModal item={customItem} groups={customItem.option_groups || []} selected={customAddons} setSelected={setCustomAddons} note={customNote} setNote={setCustomNote} qty={customQty} setQty={setCustomQty} onClose={() => setCustomItem(null)} onConfirm={confirmCustomization} />}
    </MobileShell>
  );
}

function CustomerHome({ search, setSearch, searchActive, category, setCategory, foods, menu, heroMenuGallery, featured, heroIndex, setHeroIndex, heroCount, cartCount, addressLabel, onAddress, onStore, onCart, onOrders, onProfile }) {
  return <div className="customer-home">
    <div className="storefront-progress" aria-hidden="true" />
    <header className="storefront-nav">
      <Link className="storefront-brand" href="/customer" aria-label="Behind North หน้าแรก"><span>BN</span><b>Behind North</b></Link>
      <button type="button" className="storefront-address" onClick={onAddress} aria-label="เลือกหรือแก้ไขที่อยู่จัดส่ง"><span className="address-pin">⌖</span><div><small>จัดส่งถึง</small><b>{addressLabel}</b></div><span className="address-chevron">⌄</span></button>
      <div className="storefront-search"><SearchBar value={search} onChange={(value) => { setSearch(value); if (value.trim()) setCategory("All"); }} placeholder="ค้นหาร้านหรือเมนู" /></div>
      <nav className="storefront-links"><button onClick={onOrders}>รายการสั่งซื้อ</button><button onClick={onProfile}>บัญชีของฉัน</button></nav>
      <button className="storefront-cart" onClick={onCart}><span>ตะกร้าของฉัน</span><b>🛒</b>{cartCount > 0 && <i>{cartCount}</i>}</button>
    </header>

    {!searchActive && <>
    <section className="customer-hero" data-scroll-reveal>
      <div className="hero-copy"><span className="hero-eyebrow"><i /> อร่อยใกล้ มจพ.</span><h1>มื้อนี้<br />ให้เรา <em>จัดให้</em></h1><p>รวมร้านโปรดแถวมหาวิทยาลัย<br className="desktop-break" /> ส่งตรงถึงหอ อร่อยง่ายในไม่กี่คลิก</p><button className="hero-cta" onClick={() => onStore(featured.store)}>สั่ง {featured.name} <span>↗</span></button><div className="hero-note"><span>✦</span> ร้านเด็ด ส่งไว เริ่มต้นเพียง 40 บาท</div></div>
      <div className="hero-photo hero-stage"><div className="hero-orbit hero-orbit-one" /><div className="hero-orbit hero-orbit-two" /><div className="hero-dish-frame" key={featured.id}>{featured.image ? <img className="hero-dish" src={featured.image} alt={featured.name} /> : <span className="hero-dish-placeholder">🍽️</span>}<span className="hero-dish-glint" /></div><div className="hero-photo-label"><span>เมนูแนะนำ · {featured.storeName}</span><b>{featured.name}</b><small>{featured.description || "จากร้านที่เปิดให้บริการ"} <strong>฿{featured.price}</strong></small></div><div className="hero-slide-controls" aria-label="เลือกเมนูแนะนำ"><button onClick={() => setHeroIndex((heroIndex - 1 + heroCount) % heroCount)} aria-label="เมนูก่อนหน้า">‹</button>{heroMenuGallery.map((item, index) => <button key={item.id} className={index === heroIndex ? "active" : ""} onClick={() => setHeroIndex(index)} aria-label={`แสดงเมนู ${item.name}`} />)}<button onClick={() => setHeroIndex((heroIndex + 1) % heroCount)} aria-label="เมนูถัดไป">›</button></div></div>
      <div className="hero-index"><b>{String(heroIndex + 1).padStart(2, "0")}</b><span /> {String(heroCount).padStart(2, "0")}</div>
    </section>

    <section className="discovery-section" data-scroll-reveal>
      <div className="section-heading"><div><span className="section-kicker">เลือกตามใจ</span><h2>วันนี้อยากกินอะไร?</h2></div><a href="#popular">สำรวจร้านทั้งหมด <span>→</span></a></div>
      <div className="customer-categories">{categories.map((c, i) => <button className={category === c ? "active" : ""} key={c} onClick={() => setCategory(c)}><span>{["✳", "☕", "↻", "＋"][i]}</span>{c === "All" ? "ทั้งหมด" : c === "Coffee & Tea" ? "กาแฟและชา" : c === "On Order" ? "สั่งบ่อย" : "เพิ่มเติม"}</button>)}</div>
    </section>
    </>}

    <section className="discovery-section popular-section" id="popular" data-scroll-reveal><div className="section-heading"><div><span className="section-kicker">{searchActive ? "ผลการค้นหา" : "คัดมาให้แล้ว"}</span><h2>{searchActive ? `ร้านที่ตรงกับ “${search.trim()}”` : "ร้านยอดนิยมใกล้คุณ"}</h2></div>{searchActive && <span className="search-result-count">{foods.length} ร้าน</span>}</div>
      {foods.length ? <div className="food-grid">{foods.map((food, index) => <button className={`food-card editorial-card card-tone-${index + 1}`} data-scroll-reveal key={food.id} onClick={() => onStore(food)}><div className="shop-photo">{food.photo ? <img src={food.photo} alt={`${food.name} ร้านอาหาร`} loading={index < 2 ? "eager" : "lazy"} /> : <span className="store-placeholder">🏪</span>}<span className="shop-status">เปิดอยู่</span><i>↗</i></div><div className="editorial-card-info"><small className="food-category">{food.category}</small><b>{food.name}</b><div className="food-meta"><span>{food.delivery}</span><i /><strong>เริ่ม ฿{food.price}</strong></div><div className="shop-tag-row">{food.tags.map((tag) => <small key={tag}>{tag}</small>)}</div></div></button>)}</div> : <EmptyState title="ไม่พบร้านที่ค้นหา" text="ลองค้นด้วยชื่อร้าน ชื่อเมนู หรือหมวดหมู่อื่น" />}
    </section>

    <section className="discovery-section menu-section" id="menu" data-scroll-reveal>
      <div className="section-heading"><div><span className="section-kicker">{searchActive ? "ผลการค้นหา" : "อร่อยทุกคำ คัดมาแล้ว"}</span><h2>{searchActive ? "เมนูที่ตรงกับการค้นหา" : "เมนูที่น่าลอง"}</h2></div>{searchActive ? <span className="search-result-count">{menu.length} เมนู</span> : <span className="menu-section-note">เลื่อนลงมาเจอจานโปรดของคุณ</span>}</div>
      {menu.length ? <div className="menu-gallery-grid">{menu.map((item, index) => <article className="menu-card" data-scroll-reveal key={item.id}>
        <button className="menu-photo-button" onClick={() => onStore(item.store)} aria-label={`ดูเมนูร้าน ${item.storeName}: ${item.name}`}>{item.image ? <img src={item.image} alt={item.name} loading={index < 4 ? "eager" : "lazy"} /> : <span className="menu-placeholder">🍽️</span>}<span>↗</span></button>
        <div className="menu-card-info"><div><small>{item.storeName}</small><b>{item.name}</b></div><div className="menu-card-meta"><span>★ {item.store.rating}</span><b>฿{item.price}</b></div></div>
      </article>)}</div> : searchActive && <EmptyState title="ไม่พบเมนูที่ค้นหา" text="ลองใช้ชื่อเมนูหรือชื่อร้านที่สั้นลง" />}
    </section>

  </div>;
}
function CustomerStore({ store, onBack, onCustomize, onBasket, cartCount }) {
  return <div className="restaurant-detail">
    <TopBar title={store.name} subtitle={store.category} onBack={onBack} action={<button className="topbar-cart" onClick={onBasket}>🛒 {cartCount}</button>} />
    <div className="store-hero"><div className="store-photo-large">{store.photo ? <img src={store.photo} alt={store.name} /> : <span className="store-placeholder">🏪</span>}<span className="store-open-pill">เปิดให้บริการ</span></div><div className="store-info"><div><b>{store.name}</b><small>{store.category}</small></div><div className="store-meta-line"><span>{store.delivery}</span><i /><span>{store.fee}</span></div><div className="store-detail-tags">{store.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div></div>
    <div className="restaurant-menu-heading"><div><small>ทำสดทุกจาน</small><b>เมนูของร้าน</b></div><span>{store.menu.length} เมนู</span></div>
    <div className="store-menu-grid">{store.menu.map((item) => <article className="store-menu-item" key={item.id}><div className="store-menu-photo">{item.image ? <img src={item.image} alt={item.name} loading="lazy" /> : <span className="menu-placeholder">🍽️</span>}</div><div className="store-menu-item-info"><div><b>{item.name}</b><small>{item.description}</small></div><div className="store-menu-item-bottom"><strong>฿{item.price}</strong><button onClick={() => onCustomize(item, store)} aria-label={`ปรับแต่ง ${item.name}`}>＋</button></div><small className="customize-hint">ตัวเลือกจากร้าน</small></div></article>)}</div>
    <button className="primary-btn store-cart-cta" onClick={onBasket}>ดูตะกร้า <span>{cartCount} รายการ</span></button>
  </div>;
}
function CustomizationModal({ item, groups, selected, setSelected, note, setNote, qty, setQty, onClose, onConfirm }) {
  const options = groups.flatMap((group) => group.choices || []);
  const addonsTotal = options.filter((option) => selected.includes(option.id)).reduce((sum, option) => sum + Number(option.extra_price), 0);
  const toggle = (group, id) => setSelected((current) => {
    if (!group.allow_multiple) return [...current.filter((value) => !(group.choices || []).some((choice) => choice.id === value)), id];
    return current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
  });
  const missingRequired = groups.some((group) => group.is_required && !group.choices?.some((choice) => selected.includes(choice.id)));
  return <div className="customize-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="customize-dialog" role="dialog" aria-modal="true" aria-labelledby="customize-title"><button className="customize-close" onClick={onClose} aria-label="ปิด">×</button><div className="customize-product">{item.image ? <img src={item.image} alt={item.name} /> : <span className="menu-placeholder">🍽️</span>}<div><small>ปรับแต่งเมนู</small><h2 id="customize-title">{item.name}</h2><span>฿{item.price}</span></div></div>{groups.map((group) => <div className="customize-group" key={group.id}><div className="customize-section-heading"><b>{group.name}</b><small>{group.is_required ? "จำเป็นต้องเลือก" : group.allow_multiple ? "เลือกได้หลายรายการ" : "เลือกได้หนึ่งรายการ"}</small></div><div className="customize-options">{(group.choices || []).map((option) => <label className="customize-option" key={option.id}><input type={group.allow_multiple ? "checkbox" : "radio"} name={`option-group-${group.id}`} checked={selected.includes(option.id)} onChange={() => toggle(group, option.id)} /><span>{option.name}</span><b>+฿{option.extra_price}</b></label>)}</div></div>)}{!groups.length && <p>เมนูนี้ไม่มีตัวเลือกเพิ่มเติม</p>}<label className="customize-note"><b>หมายเหตุถึงร้าน</b><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="ระบุรายละเอียดเพิ่มเติม" maxLength={180} /><small>{note.length}/180</small></label><div className="customize-footer"><div className="qty customize-qty"><button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span><button onClick={() => setQty(qty + 1)}>＋</button></div><button className="primary-btn" disabled={missingRequired} onClick={onConfirm}>เพิ่มลงตะกร้า · ฿{(Number(item.price) + addonsTotal) * qty}</button></div></section></div>;
}
function Basket({ cart, changeQty, onBack, onNext }) {
  const storeGroups = [...cart.reduce((groups, item) => {
    const key = String(item.storeId);
    if (!groups.has(key)) groups.set(key, { storeId: item.storeId, store: item.store, name: item.storeName || "ร้านอาหาร", items: [] });
    groups.get(key).items.push(item);
    return groups;
  }, new Map()).values()];

  return <><TopBar title="ตะกร้าของฉัน" onBack={onBack} />{storeGroups.length ? storeGroups.map((group) => {
    const storeSubtotal = group.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    return <section className="cart-store-group" key={group.storeId}>
      <div className="cart-shop"><CartStoreThumb store={group.store} /><div><b>{group.name}</b><small>{group.items.reduce((sum, item) => sum + item.qty, 0)} รายการ · สั่งแยกตามร้าน</small></div></div>
      {group.items.map((item) => <div className="cart-row" key={item.cartLineId || item.id}><div className="food-thumb cart-item-image">{item.image ? <img src={item.image} alt={item.name} /> : <span>🍽️</span>}</div><div className="cart-row-info"><b>{item.name}</b>{item.selectedAddons?.length > 0 && <small>เพิ่ม: {item.selectedAddons.map((option) => option.name).join(", ")}</small>}{item.note && <small>หมายเหตุ: {item.note}</small>}<small className="cart-item-price">{item.price} ฿</small></div><div className="qty"><button onClick={() => changeQty(item.cartLineId || item.id,-1)}>−</button><span>{item.qty}</span><button onClick={() => changeQty(item.cartLineId || item.id,1)}>＋</button></div></div>)}
      <div className="cart-store-checkout"><div><small>ยอดอาหารร้านนี้</small><b>{storeSubtotal.toLocaleString("th-TH")} ฿</b></div><button className="primary-btn" onClick={() => onNext(group.storeId)}>สั่งจากร้านนี้ →</button></div>
    </section>;
  }) : <EmptyState title="ตะกร้ายังว่าง" text="กลับไปที่ร้านเพื่อเลือกเมนู" />}</>;
}
function UpdateBasket({ cart, total, profile, onEditAddress, changeQty, onBack, onNext }) {
  return <><TopBar title="ตรวจสอบตะกร้า" onBack={onBack} action={<b className="orange-text">{total} ฿</b>} /><div className="order-card"><div className="cart-shop"><CartStoreThumb store={cart[0]?.store} /><div><b>{cart[0]?.storeName || "เลือกร้านค้า"}</b><small>{profile?.dormitory_name ? `${profile.dormitory_name} · ห้อง ${profile.room_number || "—"}` : "ยังไม่ได้ตั้งค่าที่อยู่จัดส่ง"}</small></div></div>{cart.map((item) => <div className="simple-line" key={item.cartLineId || item.id}><div><span>{item.name} ×{item.qty}</span>{item.selectedAddons?.length > 0 && <small className="order-custom-detail"> + {item.selectedAddons.map((option) => option.name).join(", ")}</small>}{item.note && <small className="order-custom-detail">หมายเหตุ: {item.note}</small>}</div><div className="qty"><button onClick={() => changeQty(item.cartLineId || item.id,-1)}>−</button><span>{item.qty}</span><button onClick={() => changeQty(item.cartLineId || item.id,1)}>＋</button></div></div>)}</div><button className="secondary-btn" onClick={onEditAddress}>{profile?.dormitory_id ? "เปลี่ยนที่อยู่จัดส่ง" : "เพิ่มที่อยู่จัดส่ง"}</button><button className="primary-btn" onClick={onNext}>ตรวจสอบคำสั่งซื้อ → {total} ฿</button></>;
}
function PlaceOrder({ cart, profile, subtotal, deliveryFee, total, onBack, onPlace }) {
  return <><TopBar title="ยืนยันคำสั่งซื้อ" onBack={onBack} /><div className="summary-card-big"><div className="cart-shop"><CartStoreThumb store={cart[0]?.store} /><div><b>{cart[0]?.storeName || "เลือกร้านค้า"}</b><small>{profile?.dormitory_name} · ห้อง {profile?.room_number}</small></div></div>{cart.map((item) => <div className="summary-item" key={item.cartLineId || item.id}><span>{item.name} ×{item.qty}{item.selectedAddons?.length > 0 && <small className="order-custom-detail"> + {item.selectedAddons.map((option) => option.name).join(", ")}</small>}{item.note && <small className="order-custom-detail">หมายเหตุ: {item.note}</small>}</span><b>{item.price * item.qty} ฿</b></div>)}<Summary subtotal={subtotal} delivery={deliveryFee} total={total} /></div><div className="payment-card"><b>PromptPay</b><div>ระบบจะแสดง QR หลังร้านรับคำสั่งซื้อ</div></div><button className="primary-btn" onClick={onPlace}>ส่งคำสั่งซื้อ · {total} ฿</button></>;
}
function CartStoreThumb({ store }) {
  return <div className="food-thumb cart-store-image">{store?.store_image_url ? <img src={store.store_image_url} alt={store.store_name} /> : <span>🏪</span>}</div>;
}
function Summary({ subtotal, delivery, total }) { return <div className="summary"><div><span>Subtotal</span><b>{subtotal} ฿</b></div><div><span>Delivery fee</span><b>{delivery} ฿</b></div><hr/><div className="total"><span>Total</span><strong>{total} ฿</strong></div></div>; }
function Recent({ orders, onOpen, onChat, onHome }) {
  return <><TopBar title="ออเดอร์ของฉัน" onBack={onHome} /><div className="list-title"><b>ประวัติคำสั่งซื้อ</b><span>{orders.length}</span></div>{orders.length ? orders.map((order) => <article className="recent-order-card" key={order.orderId}>
    <button className="recent-order-info" onClick={() => onOpen(order)}><div className="food-thumb">{order.status === "COMPLETED" ? "🍽️" : "🍛"}</div><div className="recent-main"><b>{order.store}</b><small>{order.items.join(" · ")}</small><span>{order.date}</span></div><div className="recent-right"><b>{order.total} ฿</b><small className={`order-status-message ${statusTone[order.status] || "yellow"}`}>{statusLabel[order.status]}</small></div></button>
    <div className="recent-order-actions"><button className="recent-chat-button" aria-label={`แชทกับร้าน ${order.store}`} onClick={() => onChat(order)}>แชท{order.unreadMessageCount > 0&&<span className="unread-chat-badge">{order.unreadMessageCount > 9 ? "9+" : order.unreadMessageCount}</span>}</button><button className="recent-track-button" onClick={() => onOpen(order)}>ติดตามออเดอร์ <span>→</span></button></div>
    {order.unreadMessageCount > 0&&<div className="recent-order-unread">● มีข้อความใหม่ {order.unreadMessageCount} ข้อความ</div>}
  </article>) : <EmptyState title="ยังไม่มีคำสั่งซื้อ" text="ออเดอร์ที่ส่งไปยังร้านจะแสดงที่นี่" />}</>;
}
function Delivery({ order, onBack, onChat, onPaid }) {
  const [qr, setQr] = useState("");
  const [qrAmount, setQrAmount] = useState(null);
  const [promptpayId, setPromptpayId] = useState("");
  const [slip, setSlip] = useState(null);
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  useEffect(() => {
    let cancelled = false;
    setQr(""); setQrAmount(null); setPromptpayId("");
    if (order?.status !== "PENDING_PAYMENT" || !order.orderId) return undefined;
    apiRequest(`/orders/${order.orderId}/payment/qr`).then((response) => { if (!cancelled) { setQr(response.qr_image_base64 || ""); setQrAmount(Number(response.amount)); setPromptpayId(response.promptpay_id || ""); } }).catch((error) => { if (!cancelled) setPaymentError(error.message); });
    return () => { cancelled = true; };
  }, [order?.orderId, order?.status]);
  async function submitSlip(event) {
    event.preventDefault(); if (!slip || !order?.orderId) return;
    setPaying(true); setPaymentError("");
    try {
      const body = new FormData(); body.append("image", slip);
      await apiRequest(`/orders/${order.orderId}/payment/verify-slip`, { method: "POST", body });
      setSlip(null); await onPaid?.();
    } catch (error) { setPaymentError(error.message); }
    finally { setPaying(false); }
  }
  const steps = ["PENDING_ACCEPT", "PENDING_PAYMENT", "PAID", "PREPARING", "READY_FOR_DELIVERY", "IN_DELIVERY", "COMPLETED"];
  const index = steps.indexOf(order?.status);
  if (!order) return <><TopBar title="ติดตามออเดอร์" onBack={onBack} /><EmptyState title="ไม่พบคำสั่งซื้อ" text="กลับไปเลือกออเดอร์จากรายการ" /></>;
  async function cancelOrder() {
    try { await apiRequest(`/orders/${order.orderId}/status`, { method:"PUT", body:{ status:"CANCELLED_BY_CUSTOMER" } }); await onPaid?.(); }
    catch (error) { setPaymentError(error.message); }
  }
  return <><TopBar title={`Order ${order.id}`} onBack={onBack} /><div className="delivery-card"><div className="delivery-order-head"><div><b>Order {order.id}</b><small>{order.date}</small><span className={`order-status-banner ${statusTone[order.status] || "yellow"}`}>{statusLabel[order.status]}</span></div><strong>{order.total} ฿</strong></div>{steps.map((step, i) => <div className={`delivery-step ${i <= index ? "done" : ""}`} key={step}><div className="step-dot">{i <= index ? "✓" : "•"}</div><div><b>{statusLabel[step]}</b><small>{i === index ? "สถานะปัจจุบัน" : i < index ? "เสร็จแล้ว" : "รอดำเนินการ"}</small></div></div>)}</div>{order.status === "PENDING_PAYMENT" && <div className="payment-card"><b>ชำระเงินด้วย PromptPay</b>{qr&&<img src={qr} alt="QR สำหรับชำระเงิน" style={{display:"block",width:220,maxWidth:"100%",margin:"14px auto"}}/>}{promptpayId&&<p>PromptPay: {promptpayId}</p>}<p>ยอดชำระรวม {Number(qrAmount ?? order.total).toLocaleString("th-TH")} บาท</p><p>สแกน QR นี้เพื่อชำระยอดของออเดอร์นี้</p><form onSubmit={submitSlip}><label>แนบรูปสลิป<input type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event)=>setSlip(event.target.files?.[0]||null)}/></label><button className="primary-btn status-action-green" disabled={paying||!slip}>{paying?"กำลังอัปโหลดรูป…":"ส่งรูปสลิป"}</button></form>{paymentError&&<p role="alert">{paymentError}</p>}</div>}{["PENDING_ACCEPT","PENDING_PAYMENT"].includes(order.status)&&<button className="secondary-btn order-danger-btn" onClick={cancelOrder}>ยกเลิกออเดอร์</button>}<div className="restaurant-line"><div className="food-thumb">🏪</div><div><b>{order.store}</b><small>รายละเอียดจากคำสั่งซื้อ</small></div></div><button className="secondary-btn order-chat-button" onClick={onChat}>แชทกับร้าน{order.unreadMessageCount > 0&&<span className="unread-chat-badge">{order.unreadMessageCount > 9 ? "9+" : order.unreadMessageCount}</span>}</button></>;
}
function Profile({ profile, savedPlace, signedIn, onBack, onSave, onLogin, onLogout, onUpdateProfile }) {
  const [username, setUsername] = useState(profile?.username || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  return <><TopBar title="บัญชีของฉัน" onBack={onBack} /><div className="profile-card-top"><div className="profile-cover"></div><div className="profile-avatar">👤</div><div className="profile-text"><b>{profile?.username || "ผู้เยี่ยมชม"}</b><small>{profile?.email || "เข้าสู่ระบบเพื่อจัดการบัญชี"}</small></div></div>{signedIn ? <form className="form-card" onSubmit={(event)=>{event.preventDefault();onUpdateProfile({...profile,username,phone});}}><label>ชื่อผู้ใช้<input value={username} onChange={(event)=>setUsername(event.target.value)} maxLength={30} required /></label><label>เบอร์โทรศัพท์<input value={phone} onChange={(event)=>setPhone(event.target.value)} inputMode="tel" maxLength={20} /></label><button className="primary-btn">บันทึกข้อมูล</button></form> : <button className="primary-btn" onClick={onLogin}>เข้าสู่ระบบ / สมัครสมาชิก</button>}<div className="profile-menu"><button onClick={onSave}><span>📍 ที่อยู่จัดส่ง</span><b>{savedPlace ? `${profile.dormitory_name} · ห้อง ${profile.room_number}` : "เพิ่มที่อยู่"}</b></button>{signedIn && <button className="danger" onClick={onLogout}><span>↪ ออกจากระบบ</span><b>›</b></button>}</div></>;
}
function SavePlace({ profile, dormitories, onBack, onSave }) {
  const [dormitoryId, setDormitoryId] = useState(profile?.dormitory_id || "");
  const [roomNumber, setRoomNumber] = useState(profile?.room_number || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  return <><TopBar title="ที่อยู่จัดส่ง" onBack={onBack} /><form className="form-card" onSubmit={(event)=>{event.preventDefault();onSave({dormitory_id:dormitoryId,room_number:roomNumber,phone});}}><h2>เลือกหอพักและห้อง</h2><label>หอพัก<select value={dormitoryId} onChange={(event)=>setDormitoryId(event.target.value)} required><option value="">เลือกหอพัก</option>{dormitories.map((dormitory)=><option key={dormitory.id} value={dormitory.id}>{dormitory.name}</option>)}</select></label><label>เลขห้อง<input value={roomNumber} onChange={(event)=>setRoomNumber(event.target.value)} maxLength={20} required /></label><label>เบอร์โทรศัพท์<input value={phone} onChange={(event)=>setPhone(event.target.value)} inputMode="tel" maxLength={20} /></label><button className="primary-btn" type="submit">บันทึกที่อยู่</button></form></>;
}
function CustomerChat({ storeName, messages, value, setValue, onSend, onBack }) {
  const messageListRef = useRef(null);
  const latestMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    const messageList = messageListRef.current;
    if (messageList) messageList.scrollTop = messageList.scrollHeight;
  }, [latestMessageId]);
  return <><div className="chat-top"><button onClick={onBack}>‹</button><div><b>{storeName || "ครัวหลังมอ"}</b><small>online</small></div><span>☎</span></div><div ref={messageListRef} className="chat-messages">{messages.map((m,i)=><div className={`chat-bubble ${m.from === "me" ? "me" : "store"}`} key={m.id || i}>{m.text}</div>)}</div><form className="chat-compose" onSubmit={onSend}><input value={value} onChange={(e)=>setValue(e.target.value)} placeholder="เขียนข้อความ..."/><button>➤</button></form></>;
}
function CustomerAuth({ mode, onBack, onSubmit, onSignUp, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (mode === "signup" && password !== confirmation) { setError("รหัสผ่านไม่ตรงกัน"); return; }
    setBusy(true);
    const message = await onSubmit({ mode, email, password });
    setError(message);
    setBusy(false);
  }
  return <div className="auth-page role-auth-layout"><button className="auth-back" onClick={onBack} type="button">‹</button><div className="auth-art">🍕 🍟 🥤 🍗</div><form className="auth-panel role-auth-card" onSubmit={submit}><h2>{mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}</h2><input type="email" value={email} onChange={(event)=>setEmail(event.target.value)} placeholder="อีเมล" autoComplete="email" required /><input value={password} onChange={(event)=>setPassword(event.target.value)} placeholder="รหัสผ่าน อย่างน้อย 6 ตัว" type="password" minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} required />{mode === "signup" && <input value={confirmation} onChange={(event)=>setConfirmation(event.target.value)} placeholder="ยืนยันรหัสผ่าน" type="password" required />}{error && <small role="alert">{error}</small>}<button className="primary-btn" disabled={busy}>{busy ? "กำลังดำเนินการ…" : mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}</button><button className="text-link" type="button" onClick={mode === "login" ? onSignUp : onLogin}>{mode === "login" ? "สมัครสมาชิก" : "มีบัญชีแล้ว? เข้าสู่ระบบ"}</button></form></div>;
}
