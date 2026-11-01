import { Link } from "react-router-dom";
import { ArrowLeft, Send, Store } from "lucide-react";

export default function Chat() {
  return (
    <div className="chat-page">
      <Link to="/customer" className="back-link">
        <ArrowLeft size={18} /> กลับ
      </Link>

      <div className="chat-header">
        <div className="chat-avatar">
          <Store size={20} />
        </div>
        <div>
          <h3>ครัวหลังมอ</h3>
          <p>ออนไลน์ · #ORD002</p>
        </div>
      </div>

      <div className="messages">
        <div className="bubble left">
          สวัสดีครับ ออเดอร์ของคุณกำลังทำอาหารอยู่นะครับ 😊
        </div>
        <div className="bubble right">ขอบคุณครับ</div>
        <div className="bubble left">
          คาดว่าจะพร้อมรับในอีกประมาณ 5-10 นาทีครับ
        </div>
      </div>

      <div className="chat-input">
        <input placeholder="พิมพ์ข้อความ..." />
        <button>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}