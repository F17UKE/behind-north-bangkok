import { Plus, Ticket } from "lucide-react";
import Badge from "../../components/Badge";
import SectionTitle from "../../components/SectionTitle";

const rows = [
  ["WELCOME10", "ลด 10%", "เปิด"],
  ["STUDENT20", "ลด 20 บาท", "เปิด"],
  ["NEWSTORE", "ลด 15%", "ปิด"]
];

export default function Promotions() {
  return (
    <div>
      <SectionTitle
        title="คูปอง / โปรโมชั่น"
        subtitle="สร้างและจัดการสิทธิประโยชน์สำหรับลูกค้า"
        action={
          <button className="primary-btn small">
            <Plus size={17} /> เพิ่มคูปอง
          </button>
        }
      />

      <div className="promo-grid">
        {rows.map(([code, discount, status]) => (
          <div className="promo-card" key={code}>
            <div className="promo-icon">
              <Ticket size={20} />
            </div>
            <div>
              <strong>{code}</strong>
              <p>{discount}</p>
            </div>
            <Badge tone={status === "เปิด" ? "green" : "gray"}>
              {status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}