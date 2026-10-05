import { MoreHorizontal, Search } from "lucide-react";
import Badge from "../../components/Badge";
import SectionTitle from "../../components/SectionTitle";

const rows = [
  ["ครัวหลังมอ", "อาหารตามสั่ง", "เปิด", "4.8"],
  ["ข้าวมันไก่ลุงหนวด", "อาหารจานเดียว", "เปิด", "4.7"],
  ["ชานมหลังมหาลัย", "เครื่องดื่ม", "ปิด", "4.6"],
  ["ร้านป้าแก้ว", "อาหารตามสั่ง", "รอตรวจสอบ", "-"]
];

export default function Stores() {
  return (
    <div>
      <SectionTitle
        title="จัดการร้านค้า"
        subtitle="ตรวจสอบร้านและสถานะการเปิดให้บริการ"
      />

      <div className="toolbar">
        <Search size={18} />
        <input placeholder="ค้นหาร้าน..." />
        <button className="primary-btn small">+ เพิ่มร้าน</button>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>ชื่อร้าน</th>
              <th>ประเภท</th>
              <th>สถานะ</th>
              <th>คะแนน</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([name, type, status, rating]) => (
              <tr key={name}>
                <td><strong>{name}</strong></td>
                <td>{type}</td>
                <td>
                  <Badge
                    tone={
                      status === "เปิด"
                        ? "green"
                        : status === "ปิด"
                          ? "gray"
                          : "yellow"
                    }
                  >
                    {status}
                  </Badge>
                </td>
                <td>⭐ {rating}</td>
                <td>
                  <button className="icon-btn">
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}