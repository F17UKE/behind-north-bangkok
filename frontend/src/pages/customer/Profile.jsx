import { Link } from "react-router-dom";
import {
  UserRound,
  MapPin,
  ClipboardList,
  Heart,
  Ticket,
  Settings,
  LogOut,
  ChevronRight
} from "lucide-react";

const items = [
  ["ที่อยู่ในการจัดส่ง", MapPin],
  ["รายการคำสั่งซื้อ", ClipboardList],
  ["รายการโปรด", Heart],
  ["คูปอง / ส่วนลด", Ticket],
  ["ตั้งค่า", Settings]
];

export default function Profile() {
  return (
    <div>
      <div className="profile-head">
        <div className="big-avatar">
          <UserRound size={34} />
        </div>
        <div>
          <h1>นักศึกษา มจพ.</h1>
          <p>098-765-4321</p>
        </div>
      </div>

      <div className="profile-card">
        {items.map(([label, Icon]) => (
          <Link to="/customer" className="profile-link" key={label}>
            <Icon size={19} />
            <span>{label}</span>
            <ChevronRight size={17} />
          </Link>
        ))}
      </div>

      <button className="logout-btn">
        <LogOut size={18} /> ออกจากระบบ
      </button>
    </div>
  );
}