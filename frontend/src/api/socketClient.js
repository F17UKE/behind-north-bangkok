// frontend/src/api/socketClient.js
import { io } from "socket.io-client";
import { getToken } from "./axiosInstance";

let socketInstance = null;
let currentRole = null;

export function getSocketUrl() {
  if (typeof window !== "undefined") {
    const host = window.location.hostname || "localhost";
    return `http://${host}:5000`;
  }
  return "http://localhost:5000";
}

/**
 * ดึงหรือสร้างการเชื่อมต่อ Socket.io
 * @param {string} role 'CUSTOMER' | 'MERCHANT' | 'RIDER' | 'ADMIN'
 */
export function getSocket(role = "CUSTOMER") {
  if (typeof window === "undefined") return null;

  const token = getToken(role);

  // หากมี instance อยู่แล้วและ role ไม่เปลี่ยน คืนค่าเดิม
  if (socketInstance && currentRole === role) {
    if (!socketInstance.connected) {
      socketInstance.connect();
    }
    return socketInstance;
  }

  // หากเปลี่ยน Role หรือสร้างใหม่
  if (socketInstance) {
    socketInstance.disconnect();
  }

  const url = getSocketUrl();
  socketInstance = io(url, {
    transports: ["websocket", "polling"],
    auth: {
      token: token || undefined
    },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000
  });

  currentRole = role;

  socketInstance.on("connect", () => {
    console.log(`🔌 [Socket.io] Connected as ${role} (id: ${socketInstance.id}) to ${url}`);
  });

  socketInstance.on("connect_error", (err) => {
    console.warn(`⚠️ [Socket.io] Connection warning:`, err.message);
  });

  return socketInstance;
}

/**
 * ตัดการเชื่อมต่อ Socket
 */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    currentRole = null;
  }
}

/**
 * เล่นเสียงกระดิ่งแจ้งเตือนออเดอร์ (Web Audio API Synthesizer)
 * ไม่ต้องพึ่งพาไฟล์เสียงภายนอก ทำงานได้ทันทีบนทุกเบราว์เซอร์
 */
export function playOrderChime() {
  if (typeof window === "undefined") return;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const t = ctx.currentTime;

    // Tone 1: High crisp bell (D5 - 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, t);
    gain1.gain.setValueAtTime(0.28, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.35);

    // Tone 2: Harmonic pleasant ding (A5 - 880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, t + 0.12);
    gain2.gain.setValueAtTime(0.35, t + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t + 0.12);
    osc2.stop(t + 0.7);

    // Tone 3: Shimmer (E6 - 1318.5 Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(1318.51, t + 0.22);
    gain3.gain.setValueAtTime(0.22, t + 0.22);
    gain3.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(t + 0.22);
    osc3.stop(t + 0.9);

  } catch (err) {
    console.warn("Could not play audio chime:", err);
  }
}
