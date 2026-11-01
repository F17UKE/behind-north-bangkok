import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  ChevronRight,
  Clock3,
  Star,
  Bike,
  Sparkles
} from "lucide-react";
import { stores } from "../../data/mockData";
import SectionTitle from "../../components/SectionTitle";

export default function Home() {
  return (
    <div>
      <section className="customer-hero-card">
        <div>
          <span className="eyebrow light">BEHIND NB</span>
          <h1>
            หิวเมื่อไหร่
            <br />
            สั่งร้านหลังมอได้เลย 🍜
          </h1>
          <p>อาหารใกล้มหาวิทยาลัย จัดส่งถึงคุณง่าย ๆ</p>
        </div>
        <div className="hero-food">🍛</div>
      </section>

      <div className="search-box">
        <Search size={20} />
        <input placeholder="ค้นหาร้าน หรือเมนูที่อยากกิน..." />
      </div>

      <div className="location-chip">
        <MapPin size={17} />
        หอพักมหาวิทยาลัย มจพ.
        <ChevronRight size={16} />
      </div>

      <div className="quick-cats">
        {[
          ["🍛", "อาหารตามสั่ง"],
          ["🍚", "ข้าว"],
          ["🍟", "ของทอด"],
          ["🧋", "เครื่องดื่ม"]
        ].map(([icon, label]) => (
          <button key={label} className="quick-cat">
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      <SectionTitle title="ร้านแนะนำ" subtitle="ร้านยอดนิยมใกล้คุณ" />

      <div className="store-grid">
        {stores.map((store) => (
          <Link
            to={`/customer/store/${store.id}`}
            className="store-card"
            key={store.id}
          >
            <img src={store.image} alt={store.name} />
            <div className="store-card-body">
              <div className="row-between">
                <h3>{store.name}</h3>
                <span className={store.open ? "open-dot" : "closed-dot"}>
                  {store.open ? "เปิด" : "ปิด"}
                </span>
              </div>
              <p>{store.category}</p>
              <div className="store-meta">
                <span>
                  <Star size={15} fill="currentColor" /> {store.rating}
                </span>
                <span>
                  <Clock3 size={15} /> {store.time}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="info-strip">
        <Bike size={24} />
        <div>
          <strong>ติดตามออเดอร์แบบเรียลไทม์</strong>
          <p>ดูสถานะการทำอาหารและการจัดส่งได้ตลอดเวลา</p>
        </div>
        <Sparkles size={22} />
      </div>
    </div>
  );
}