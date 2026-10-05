"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

/**
 * Test Chat Page (Next.js client)
 * - ปรับ BACKEND_URL ให้ตรงกับ backend ของคุณ
 * - คาดว่า backend รองรับ events: join_order_room, leave_order_room, send_message, new_message
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function TestChatPage() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  const [orderId, setOrderId] = useState("order_1");
  const [role, setRole] = useState("CUSTOMER"); // CUSTOMER | STORE | RIDER
  const [senderName, setSenderName] = useState("Panukorn");
  const [messageText, setMessageText] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  // ป้องกันการเชื่อมต่อซ้ำ (React Strict Mode จะ mount/unmount สองครั้งใน dev)
  useEffect(() => {
    // สร้าง socket แต่ยังไม่ส่ง join ใด ๆ
    const socket = io(BACKEND_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      pushSystem(`Connected (id: ${socket.id})`);
    });

    socket.on("disconnect", (reason) => {
      setConnected(false);
      pushSystem(`Disconnected (${reason})`);
    });

    // รับข้อความจาก backend (ชื่อ event: new_message)
    socket.on("new_message", (payload) => {
      // payload คาดว่าเป็น { orderId, from, role, contentText, ts, isMerchantSender, senderSubRole }
      pushMessageFromServer(payload);
    });

    // เปลี่ยนเป็น socketRef.current
    socketRef.current.on('chat_history', (messages) => {
      console.log("📜 โหลดประวัติแชทเก่า:", messages);
      
      const formattedHistory = messages.map(msg => ({
        // โคลนข้อมูลเดิมมาทั้งหมดก่อน
        ...msg,
        // สร้างชื่อตัวแปรแบบ CamelCase เผื่อให้ UI นำไปใช้ง่ายๆ
        isMerchantSender: msg.is_merchant_sender,
        senderSubRole: msg.sender_sub_role,
        contentText: msg.content_text,
        ts: msg.created_at || new Date().toISOString()
      }));

      // เซ็ตค่าทับไปเลย ป้องกันการกดซ้ำแล้วข้อความเบิ้ล
      setChatHistory([
        { type: 'system', text: `--- โหลดประวัติการสนทนาเก่า (${messages.length} ข้อความ) ---` },
        ...formattedHistory
      ]);
    });

    // optional: system messages
    socket.on("system_message", (payload) => {
      pushSystem(payload?.text || "System message");
    });

    return () => {
      // cleanup
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushSystem = (text) => {
    setChatHistory((prev) => [
      ...prev,
      { type: "system", text, ts: Date.now() },
    ]);
  };

  const pushMessageFromServer = (payload) => {
    setChatHistory((prev) => [
      ...prev,
      {
        type: "message",
        from: payload.from || payload.senderName || "Unknown",
        role: payload.role || payload.senderSubRole || (payload.isMerchantSender ? "STORE" : "CUSTOMER"),
        contentText: payload.contentText || payload.content_text || payload.text || "",
        ts: payload.ts || Date.now(),
        isSelf: false,
      },
    ]);
  };

  const handleJoinRoom = () => {
    if (!socketRef.current || !socketRef.current.connected) {
      pushSystem("ยังไม่ได้เชื่อมต่อกับเซิร์ฟเวอร์");
      return;
    }
    if (!orderId) {
      pushSystem("กรุณาระบุ Order / Room ID");
      return;
    }
    const payload = { orderId, role, senderName };
    socketRef.current.emit("join_order_room", payload, (ack) => {
      pushSystem(`เข้าห้อง ${orderId} เป็น ${role}${ack ? ` — ${JSON.stringify(ack)}` : ""}`);
    });
  };

  const handleLeaveRoom = () => {
    if (!socketRef.current || !socketRef.current.connected) {
      pushSystem("ยังไม่ได้เชื่อมต่อกับเซิร์ฟเวอร์");
      return;
    }
    socketRef.current.emit("leave_order_room", { orderId, role, senderName }, (ack) => {
      pushSystem(`ออกจากห้อง ${orderId}${ack ? ` — ${JSON.stringify(ack)}` : ""}`);
    });
  };

  const handleSendMessage = () => {
    if (!socketRef.current || !socketRef.current.connected) {
      pushSystem("ยังไม่ได้เชื่อมต่อกับเซิร์ฟเวอร์");
      return;
    }
    if (!messageText.trim()) return;

    const payload = {
      orderId,
      from: senderName || "Anonymous",
      role,
      isMerchantSender: role === "STORE" || role === "RIDER",
      senderSubRole: role === "STORE" || role === "RIDER" ? role : null,
      contentText: messageText.trim(),
      ts: Date.now(),
    };

    // ส่ง event ไปยัง backend (backend ควรรองรับ 'send_message')
    socketRef.current.emit("send_message", payload, (ack) => {
      // ack เป็น optional callback จาก server
      // แสดงข้อความฝั่ง client ทันที
      setChatHistory((prev) => [
        ...prev,
        {
          type: "message",
          from: payload.from,
          role: payload.role,
          contentText: payload.contentText,
          ts: payload.ts,
          isSelf: true,
        },
      ]);
      setMessageText("");
    });
  };

  const formatTime = (ts) => {
    try {
      return new Date(ts).toLocaleTimeString();
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">ทดสอบระบบ Chat (Next.js)</h2>

        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`px-3 py-1 rounded-full text-white font-medium ${connected ? "bg-green-600" : "bg-red-600"}`}>
              {connected ? "🟢 Connected" : "🔴 Disconnected"}
            </div>
            <div className="text-sm text-gray-600">Backend: <span className="font-mono">{BACKEND_URL}</span></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              className="border rounded p-2"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Order / Room ID (เช่น order_1)"
            />
            <select className="border rounded p-2" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="CUSTOMER">ลูกค้า (CUSTOMER)</option>
              <option value="STORE">ร้านค้า (STORE)</option>
              <option value="RIDER">คนส่ง (RIDER)</option>
            </select>
            <input
              className="border rounded p-2"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="ชื่อผู้ส่ง"
            />
          </div>

          <div className="flex gap-2 mt-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleJoinRoom}>เข้าห้องแชท</button>
            <button className="bg-gray-400 text-white px-4 py-2 rounded" onClick={handleLeaveRoom}>ออกจากห้อง</button>
            <button className="bg-yellow-500 text-white px-4 py-2 rounded" onClick={() => { setChatHistory([]); }}>ล้างหน้าต่าง</button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div id="messages" className="h-80 overflow-auto p-2 border rounded">
            {chatHistory.length === 0 && (
                <div className="text-sm text-gray-500">ยังไม่มีข้อความ</div>
            )}

            {chatHistory.map((m, idx) => {
            // 1. จัดการข้อความระบบ
            if (m.type === "system") {
                return (
                <div key={idx} className="text-xs text-gray-500 my-2 text-center">
                    — {m.text} — <span className="ml-2 text-gray-400">{formatTime(m.ts)}</span>
                </div>
                );
            }

            // 2. ดักจับตัวแปรให้ครอบคลุมทั้งจาก Socket (พิมพ์ใหม่) และ DB (ประวัติเก่า)
            const role = m.role || m.senderSubRole || m.sender_sub_role || "";

            const isMerchant = 
                m.isMerchantSender === true || 
                m.is_merchant_sender === true || 
                m.is_merchant_sender === 1 || 
                role === "STORE" || 
                role === "RIDER";

            const text = m.contentText || m.content_text || m.text || m.message || "";

            return (
                <div key={idx} className={`mb-3 ${m.isSelf ? "text-right" : "text-left"}`}>
                {/* แสดงชื่อถ้ามี */}
                {m.from && (
                    <div className="text-xs text-gray-500">
                    <strong>{m.from}</strong>
                    </div>
                )}

                {/* แสดง Role จากตัวแปรที่ดักจับไว้ และเวลา */}
                <div className="text-xs text-gray-500">
                    {isMerchant ? (role === "STORE" ? "🏪 ร้านค้า" : "🛵 คนส่ง") : "🧑 ลูกค้า"}
                    <span className="ml-2 text-gray-400">{formatTime(m.ts)}</span>
                </div>

                {/* แสดงข้อความจากตัวแปรที่ดักจับไว้ */}
                <div
                    className={`inline-block mt-1 px-3 py-2 rounded-lg ${
                    m.isSelf ? "bg-green-100" : isMerchant ? "bg-yellow-100" : "bg-blue-50"
                    }`}
                >
                    {text}
                </div>
                </div>
            );
            })}

          </div>

          <div className="flex gap-2 mt-3">
            <input
              className="flex-1 border rounded p-2"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
              placeholder="พิมพ์ข้อความ... (Enter เพื่อส่ง, Shift+Enter ขึ้นบรรทัดใหม่)"
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSendMessage}>ส่ง</button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <div>หมายเหตุ:</div>
          <ul className="list-disc ml-5">
            <li>Backend ต้องรองรับ events: <span className="font-mono">join_order_room</span>, <span className="font-mono">leave_order_room</span>, <span className="font-mono">send_message</span> และส่งข้อความกลับด้วย <span className="font-mono">new_message</span>.</li>
            <li>หากเจอปัญหา CORS ให้ตั้งค่า backend ให้อนุญาต origin ของ Next.js (เช่น <span className="font-mono">http://localhost:3000</span>).</li>
            <li>ในโหมดพัฒนา (React Strict Mode) หากเกิดการเชื่อมต่อซ้ำ โค้ดนี้ใช้ useEffect + cleanup เพื่อป้องกันการค้างของ socket.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
