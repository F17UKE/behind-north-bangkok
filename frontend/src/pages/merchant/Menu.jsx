import { Plus, MoreHorizontal } from "lucide-react";
import { menuItems } from "../../data/mockData";
import SectionTitle from "../../components/SectionTitle";

export default function Menu() {
  return (
    <div>
      <SectionTitle
        title="จัดการเมนู"
        subtitle="เปิด-ปิดเมนูและแก้ไขราคา"
        action={
          <button className="primary-btn small">
            <Plus size={17} /> เพิ่มเมนู
          </button>
        }
      />

      <div className="category-tabs">
        <button className="active">เมนูทั้งหมด</button>
        <button>ข้าว</button>
        <button>เส้น</button>
        <button>กับข้าว</button>
        <button>เครื่องดื่ม</button>
      </div>

      <div className="menu-admin-list">
        {menuItems.map((item) => (
          <div className="menu-admin-row" key={item.id}>
            <img src={item.image} alt={item.name} />
            <div>
              <h3>{item.name}</h3>
              <p>{item.price} บาท</p>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked={item.available} />
              <span />
            </label>
            <button className="icon-btn">
              <MoreHorizontal size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}