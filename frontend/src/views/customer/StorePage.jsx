import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Heart, Plus, ShoppingBag } from "lucide-react";
import { menuItems, stores } from "../../data/mockData";
import SectionTitle from "../../components/SectionTitle";

export default function StorePage() {
  const { storeId } = useParams();
  const store = stores.find((item) => item.id === storeId) || stores[0];
  const menu = menuItems.filter((item) => item.storeId === store.id);

  return (
    <div>
      <Link to="/customer" className="back-link">
        <ArrowLeft size={18} /> กลับ
      </Link>

      <div className="store-cover">
        <img src={store.image} alt={store.name} />
        <button className="floating-btn">
          <Heart size={20} />
        </button>
      </div>

      <div className="store-heading">
        <div>
          <h1>{store.name}</h1>
          <p>
            {store.category} · ⭐ {store.rating} ({store.reviews}) ·{" "}
            {store.time}
          </p>
        </div>
        <span className={`status-pill ${store.open ? "open" : "closed"}`}>
          {store.open ? "เปิดรับออเดอร์" : "ปิดร้าน"}
        </span>
      </div>

      <div className="tabs">
        <button className="active">เมนู</button>
        <button>รีวิว</button>
        <button>ข้อมูลร้าน</button>
      </div>

      <SectionTitle title="เมนูยอดนิยม" />

      <div className="menu-list">
        {menu.map((item) => (
          <div
            className={`menu-item ${!item.available ? "disabled" : ""}`}
            key={item.id}
          >
            <img src={item.image} alt={item.name} />
            <div className="menu-info">
              <h3>{item.name}</h3>
              <strong>{item.price} บาท</strong>
              <p>{item.available ? "พร้อมขาย" : "หมดชั่วคราว"}</p>
            </div>
            <button className="add-btn" disabled={!item.available}>
              <Plus size={20} />
            </button>
          </div>
        ))}
      </div>

      <Link to="/customer/cart" className="floating-cart">
        <ShoppingBag size={19} />
        ดูตะกร้า
        <span>2 รายการ · 90 บาท</span>
      </Link>
    </div>
  );
}