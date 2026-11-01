import { Check, X, Bell } from "lucide-react";
import { orders } from "../../data/mockData";
import OrderStatus from "../../components/OrderStatus";
import SectionTitle from "../../components/SectionTitle";

export default function Orders() {
  return (
    <div>
      <SectionTitle
        title="จัดการออเดอร์"
        subtitle="รับออเดอร์และอัปเดตสถานะให้ลูกค้า"
      />

      <div className="filter-tabs">
        <button className="active">รอรับ (3)</button>
        <button>กำลังทำ (2)</button>
        <button>เสร็จสิ้น</button>
      </div>

      <div className="order-list">
        {orders.map((o) => (
          <div className="order-card" key={o.id}>
            <div className="order-card-top">
              <div>
                <strong>{o.id}</strong>
                <p>{o.customer} · {o.time}</p>
              </div>
              <OrderStatus status={o.status} />
            </div>

            <div className="order-card-main">
              <div>
                <p>ข้าวกะเพราไก่ x1</p>
                <p>ข้าวไข่เจียว x1</p>
              </div>
              <strong>{o.total} บาท</strong>
            </div>

            <div className="order-actions">
              <button className="danger-btn">
                <X size={17} /> ปฏิเสธ
              </button>
              <button className="success-btn">
                <Check size={17} /> รับออเดอร์
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="notification">
        <Bell size={20} />
        <div>
          <strong>เปิดแจ้งเตือน</strong>
          <p>แจ้งเตือนทันทีเมื่อมีออเดอร์ใหม่</p>
        </div>
        <label className="switch">
          <input type="checkbox" defaultChecked />
          <span />
        </label>
      </div>
    </div>
  );
}