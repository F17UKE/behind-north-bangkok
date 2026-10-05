import { Send, Search } from "lucide-react";

const contacts = ["นักศึกษา มจพ.", "Petchtae", "Thanakrit", "Napat"];

export default function Chat() {
  return (
    <div className="merchant-chat">
      <div className="chat-sidebar">
        <div className="search-box">
          <Search size={17} />
          <input placeholder="ค้นหาชื่อออเดอร์..." />
        </div>

        {contacts.map((name, index) => (
          <div className={`chat-contact ${index === 0 ? "active" : ""}`} key={name}>
            <div className="mini-avatar">{name[0]}</div>
            <div>
              <strong>{name}</strong>
              <p>#ORD00{index + 1}</p>
            </div>
            <span>10:2{index}</span>
          </div>
        ))}
      </div>

      <div className="chat-window">
        <div className="chat-header">
          <div className="mini-avatar">น</div>
          <div>
            <strong>นักศึกษา มจพ.</strong>
            <p>#ORD001</p>
          </div>
        </div>

        <div className="messages">
          <div className="bubble left">ออเดอร์เรียบร้อยแล้วครับ</div>
          <div className="bubble right">ขอบคุณครับ</div>
          <div className="bubble left">
            อาหารเสร็จแล้ว สามารถมารับได้เลยครับ
          </div>
        </div>

        <div className="chat-input">
          <input placeholder="พิมพ์ข้อความ..." />
          <button>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}