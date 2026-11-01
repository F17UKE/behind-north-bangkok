"use client";

import { useState } from "react";
import Link from "next/link";
import FigmaViewer from "../../components/FigmaViewer";

const screens = {
  welcome: "/figma/merchant/welcome.png",
  main: "/figma/merchant/main.png",
  orders: "/figma/merchant/orders.png",
  delivery: "/figma/merchant/delivery.png",
  chat: "/figma/merchant/chat.png",
  signin: "/figma/merchant/signin.png",
  signup: "/figma/merchant/signup.png",
};

export default function FigmaMerchant() {
  const [screen, setScreen] = useState("welcome");

  const hotspots = {
    welcome: [{ id: "start", x: 10, y: 78, w: 80, h: 15, onClick: () => setScreen("main") }],
    main: [
      { id: "orders", x: 0, y: 8, w: 100, h: 31, onClick: () => setScreen("orders") },
      { id: "delivery", x: 0, y: 57, w: 100, h: 22, onClick: () => setScreen("delivery") },
      { id: "chat", x: 0, y: 82, w: 100, h: 17, onClick: () => setScreen("chat") },
    ],
    orders: [
      { id: "home", x: 0, y: 0, w: 18, h: 10, onClick: () => setScreen("main") },
      { id: "delivery", x: 35, y: 0, w: 25, h: 10, onClick: () => setScreen("delivery") },
      { id: "chat", x: 63, y: 0, w: 25, h: 10, onClick: () => setScreen("chat") },
      { id: "accept", x: 4, y: 12, w: 92, h: 13, onClick: () => setScreen("delivery") },
    ],
    delivery: [
      { id: "home", x: 0, y: 0, w: 18, h: 11, onClick: () => setScreen("main") },
      { id: "orders", x: 28, y: 0, w: 25, h: 11, onClick: () => setScreen("orders") },
      { id: "chat", x: 62, y: 0, w: 25, h: 11, onClick: () => setScreen("chat") },
    ],
    chat: [
      { id: "home", x: 0, y: 0, w: 18, h: 15, onClick: () => setScreen("main") },
      { id: "orders", x: 30, y: 0, w: 24, h: 15, onClick: () => setScreen("orders") },
      { id: "delivery", x: 63, y: 0, w: 25, h: 15, onClick: () => setScreen("delivery") },
    ],
    signin: [{ id: "submit", x: 7, y: 55, w: 86, h: 11, onClick: () => setScreen("main") }],
    signup: [{ id: "submit", x: 7, y: 55, w: 86, h: 11, onClick: () => setScreen("main") }],
  };

  return (
    <main className="figma-route-page merchant-route">
      <div className="route-toolbar">
        <Link href="/" className="back-role">← Roles</Link>
        <div className="toolbar-title">Merchant</div>
        <div className="toolbar-actions">
          <button onClick={() => setScreen("signin")}>Sign in</button>
          <button onClick={() => setScreen("signup")}>Sign up</button>
        </div>
      </div>
      <div className="merchant-screens">
        <FigmaViewer src={screens[screen]} alt={`Figma merchant ${screen}`} hotspots={hotspots[screen]} className={screen === "main" ? "merchant-long" : "merchant-fit"} />
      </div>
      <div className="route-mini-nav merchant-mini-nav">
        {Object.keys(screens).map((name) => <button key={name} className={screen === name ? "active" : ""} onClick={() => setScreen(name)}>{name}</button>)}
      </div>
    </main>
  );
}
