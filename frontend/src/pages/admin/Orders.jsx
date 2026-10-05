import { Search } from "lucide-react";
import { orders } from "../../data/mockData";
import OrderStatus from "../../components/OrderStatus";
import SectionTitle from "../../components/SectionTitle";

export default function Orders() {
  return (
    <div>
      <SectionTitle
        title="จัดการออเดอร์"
        subtitle="ตรวจสอบและช่วยเหลือคำสั่งซื้อทั้งหมดในระบบ"
      />

      <div className="filter-tabs">
        <button className="active">ทั้งหมด</button>
        <button>กำลังดำเนินการ</button>
        <button>เสร็จสิ้น</button>
        <button>ยกเลิก</button>
      </div>

      <div className="toolbar">
        <Search size={18} />
        <input placeholder="ค้นหาเลขออเดอร์ / ลูกค้า / ร้านค้า..." />
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>ลูกค้า</th>
              <th>ร้านค้า</th>
              <th>ยอดรวม</th>
              <th>สถานะ</th>
              <th>เวลา</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><strong>{o.id}</strong></td>
                <td>{o.customer}</td>
                <td>{o.store}</td>
                <td>{o.total} บาท</td>
                <td><OrderStatus status={o.status} /></td>
                <td>{o.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}