import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ChefHat, Bike, Clock3 } from "lucide-react";
import OrderStatus from "../../components/OrderStatus";

const steps = [
  ["รับคำสั่งซื้อแล้ว", "ร้านได้รับคำสั่งซื้อของคุณ", CheckCircle2, true],
  ["กำลังทำอาหาร", "คาดว่าจะเสร็จใน 10 นาที", ChefHat, true],
  ["รอรับอาหาร", "ไรเดอร์กำลังเดินทาง", Bike, false],
  ["เสร็จสิ้น", "รับประทานอาหารให้อร่อย", Clock3, false]
];

export default function Orders() {
  return (
    <div>
      <Link to="/customer" className="back-link">
        <ArrowLeft size={18} /> กลับ
      </Link>

      <div className="order-header">
        <div>
          <p className="eyebrow">ORDER #ORD002</p>
          <h1>ติดตามคำสั่งซื้อ</h1>
        </div>
        <OrderStatus status="กำลังทำอาหาร" />
      </div>

      <div className="timeline">
        {steps.map(([title, desc, Icon, active]) => (
          <div className={`timeline-item ${active ? "active" : ""}`} key={title}>
            <div className="timeline-icon">
              <Icon size={19} />
            </div>
            <div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="order-detail card">
        <h3>รายละเอียดคำสั่งซื้อ</h3>
        <p>#ORD002 · ครัวหลังมอ</p>

        <div className="detail-line">
          <span>ข้าวกะเพราไก่ x1</span>
          <b>45 บาท</b>
        </div>
        <div className="detail-line">
          <span>ข้าวไข่เจียว x1</span>
          <b>35 บาท</b>
        </div>
        <div className="detail-line">
          <span>ค่าจัดส่ง</span>
          <b>10 บาท</b>
        </div>
        <hr />
        <div className="detail-line total">
          <span>รวม</span>
          <strong>90 บาท</strong>
        </div>
      </div>

      <Link to="/customer/chat" className="secondary-btn full">
        แชทร้านค้า
      </Link>
    </div>
  );
}