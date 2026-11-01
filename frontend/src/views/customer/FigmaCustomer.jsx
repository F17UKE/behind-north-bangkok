"use client";

import { useState } from "react";
import Link from "next/link";
import FigmaViewer from "../../components/FigmaViewer";

const screens = {
  home: "/figma/customer/home.png",
  store: "/figma/customer/store.png",
  basket: "/figma/customer/basket.png",
  update: "/figma/customer/update.png",
  place: "/figma/customer/place.png",
  recent: "/figma/customer/recent.png",
  delivery: "/figma/customer/delivery.png",
  profile: "/figma/customer/profile.png",
  savePlace: "/figma/customer/savePlace.png",
  savePlacePF: "/figma/customer/savePlacePF.png",
  signin: "/figma/customer/signin.png",
  signup: "/figma/customer/signup.png",
  chat: "/figma/customer/chat.png",
};

export default function FigmaCustomer() {
  const [screen, setScreen] = useState("home");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const open = (next) => setScreen(next);

  const hotspots = {
    home: [
      { id: "store", label: "Open store", x: 2, y: 40, w: 96, h: 38, onClick: () => open("store") },
      { id: "recent", label: "Orders", x: 28, y: 84, w: 26, h: 15, onClick: () => open(orderPlaced ? "recent" : "store") },
      { id: "profile", label: "Profile", x: 55, y: 84, w: 26, h: 15, onClick: () => open("profile") },
    ],
    store: [
      { id: "back", label: "Back", x: 2, y: 8, w: 16, h: 12, onClick: () => open("home") },
      { id: "add1", label: "Add food", x: 2, y: 34, w: 46, h: 24, onClick: () => open("basket") },
      { id: "add2", label: "Add food", x: 50, y: 34, w: 46, h: 24, onClick: () => open("basket") },
      { id: "add3", label: "Add food", x: 2, y: 61, w: 46, h: 24, onClick: () => open("basket") },
      { id: "cart", label: "Basket", x: 82, y: 80, w: 17, h: 17, onClick: () => open("basket") },
    ],
    basket: [
      { id: "back", label: "Back", x: 0, y: 5, w: 16, h: 10, onClick: () => open("store") },
      { id: "next", label: "Update basket", x: 5, y: 88, w: 90, h: 8, onClick: () => open("update") },
    ],
    update: [
      { id: "back", label: "Back", x: 0, y: 5, w: 16, h: 10, onClick: () => open("basket") },
      { id: "save", label: "Save place", x: 5, y: 62, w: 90, h: 10, onClick: () => open("savePlace") },
      { id: "next", label: "Continue", x: 5, y: 88, w: 90, h: 8, onClick: () => open("place") },
    ],
    place: [
      { id: "back", label: "Back", x: 0, y: 5, w: 16, h: 10, onClick: () => open("update") },
      { id: "place", label: "Place order", x: 5, y: 88, w: 90, h: 8, onClick: () => { setOrderPlaced(true); open("recent"); } },
    ],
    recent: [
      { id: "order", label: "Open order", x: 2, y: 12, w: 96, h: 26, onClick: () => open("delivery") },
      { id: "home", label: "Home", x: 1, y: 82, w: 33, h: 15, onClick: () => open("home") },
      { id: "profile", label: "Profile", x: 66, y: 82, w: 33, h: 15, onClick: () => open("profile") },
    ],
    delivery: [
      { id: "back", label: "Back", x: 0, y: 5, w: 16, h: 10, onClick: () => open("recent") },
      { id: "chat", label: "Chat", x: 5, y: 88, w: 90, h: 8, onClick: () => open("chat") },
    ],
    profile: [
      { id: "save", label: "Saved place", x: 3, y: 36, w: 94, h: 10, onClick: () => open("savePlacePF") },
      { id: "home", label: "Home", x: 2, y: 82, w: 30, h: 15, onClick: () => open("home") },
    ],
    savePlacePF: [
      { id: "back", label: "Back", x: 0, y: 5, w: 16, h: 10, onClick: () => open("profile") },
    ],
    savePlace: [
      { id: "back", label: "Back", x: 0, y: 5, w: 16, h: 10, onClick: () => open("update") },
      { id: "save", label: "Save", x: 5, y: 88, w: 90, h: 8, onClick: () => open("profile") },
    ],
    signin: [
      { id: "submit", label: "Sign in", x: 6, y: 55, w: 88, h: 10, onClick: () => open("home") },
      { id: "signup", label: "Sign up", x: 52, y: 67, w: 30, h: 8, onClick: () => open("signup") },
    ],
    signup: [
      { id: "submit", label: "Sign up", x: 6, y: 60, w: 88, h: 10, onClick: () => open("home") },
      { id: "login", label: "Sign in", x: 52, y: 72, w: 30, h: 8, onClick: () => open("signin") },
    ],
    chat: [
      { id: "back", label: "Back", x: 0, y: 5, w: 16, h: 10, onClick: () => open("delivery") },
    ],
  };

  return (
    <main className="figma-route-page">
      <div className="route-toolbar">
        <Link href="/" className="back-role">← Roles</Link>
        <div className="toolbar-title">Customer</div>
        <div className="toolbar-actions">
          <button onClick={() => open("signin")}>Sign in</button>
          <button onClick={() => open("signup")}>Sign up</button>
        </div>
      </div>
      <div className="figma-stage customer-stage">
        <FigmaViewer src={screens[screen]} alt={`Figma customer ${screen}`} hotspots={hotspots[screen] || []} />
      </div>
      <div className="route-mini-nav">
        {Object.keys(screens).map((name) => (
          <button key={name} className={screen === name ? "active" : ""} onClick={() => open(name)}>{name}</button>
        ))}
      </div>
    </main>
  );
}
