import { MoreHorizontal, Search } from "lucide-react";
import Badge from "../../components/Badge";
import SectionTitle from "../../components/SectionTitle";

const rows = [
  ["นักศึกษา มจพ.", "098-765-4321", "ลูกค้า", "ใช้งาน"],
  ["Petchtae", "081-222-3333", "ร้านค้า", "ใช้งาน"],
  ["Thanakrit", "081-333-4444", "ลูกค้า", "ระงับ"],
  ["Napat", "082-444-5555", "ลูกค้า", "ใช้งาน"]
];

export default function Users() {
  return (
    <div>
      <SectionTitle
        title="จัดการผู้ใช้"
        subtitle="จัดการบัญชีลูกค้า ร้านค้า และแอดมิน"
        action={<button className="primary-btn small">+ เพิ่มผู้ใช้</button>}
      />

      <div className="toolbar">
        <Search size={18} />
        <input placeholder="ค้นหาชื่อ หรือเบอร์โทร..." />
        <select>
          <option>ทุกบทบาท</option>
          <option>ลูกค้า</option>
          <option>ร้านค้า</option>
        </select>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>เบอร์โทร</th>
              <th>บทบาท</th>
              <th>สถานะ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([name, phone, role, status]) => (
              <tr key={name}>
                <td><strong>{name}</strong></td>
                <td>{phone}</td>
                <td>{role}</td>
                <td>
                  <Badge tone={status === "ใช้งาน" ? "green" : "red"}>
                    {status}
                  </Badge>
                </td>
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