"use client";

import { useState } from "react";
import Link from "next/link";
import FigmaViewer from "../../components/FigmaViewer";

const screens = {
  home: "/figma/admin/home.png",
  users: "/figma/admin/users.png",
  detail: "/figma/admin/detail.png",
  more: "/figma/admin/more.png",
  chat: "/figma/admin/chat.png",
  support: "/figma/admin/support.png",
};

export default function FigmaAdmin() {
  const [screen, setScreen] = useState("home");

  const hotspots = {
    home: [
      { id: "user", x: 25, y: 83, w: 25, h: 15, onClick: () => setScreen("users") },
      { id: "chat", x: 50, y: 83, w: 25, h: 15, onClick: () => setScreen("chat") },
      { id: "more", x: 75, y: 83, w: 24, h: 15, onClick: () => setScreen("more") },
    ],
    users: [
      { id: "userDetail", x: 3, y: 20, w: 94, h: 10, onClick: () => setScreen("detail") },
      { id: "home", x: 0, y: 84, w: 25, h: 14, onClick: () => setScreen("home") },
      { id: "more", x: 75, y: 84, w: 24, h: 14, onClick: () => setScreen("more") },
    ],
    detail: [
      { id: "back", x: 0, y: 0, w: 18, h: 10, onClick: () => setScreen("users") },
      { id: "message", x: 5, y: 58, w: 90, h: 10, onClick: () => setScreen("chat") },
    ],
    more: [
      { id: "home", x: 0, y: 84, w: 25, h: 14, onClick: () => setScreen("home") },
      { id: "user", x: 25, y: 84, w: 25, h: 14, onClick: () => setScreen("users") },
      { id: "chat", x: 50, y: 84, w: 25, h: 14, onClick: () => setScreen("chat") },
    ],
    chat: [{ id: "back", x: 0, y: 0, w: 18, h: 10, onClick: () => setScreen("home") }],
    support: [{ id: "back", x: 0, y: 0, w: 18, h: 10, onClick: () => setScreen("home") }],
  };

  return (
    <main className="figma-route-page admin-route">
      <div className="route-toolbar">
        <Link href="/" className="back-role">← Roles</Link>
        <div className="toolbar-title">Admin</div>
        <div className="toolbar-actions">
          <button onClick={() => setScreen("home")}>Home</button>
          <button onClick={() => setScreen("users")}>Users</button>
        </div>
      </div>
      <div className="figma-stage admin-stage">
        <FigmaViewer src={screens[screen]} alt={`Figma admin ${screen}`} hotspots={hotspots[screen]} />
      </div>
      <div className="route-mini-nav admin-mini-nav">
        {Object.keys(screens).map((name) => <button key={name} className={screen === name ? "active" : ""} onClick={() => setScreen(name)}>{name}</button>)}
      </div>
    </main>
  );
}
