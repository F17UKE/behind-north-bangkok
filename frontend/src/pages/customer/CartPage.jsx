import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Trash2, MapPin } from "lucide-react";
import SectionTitle from "../../components/SectionTitle";

const cartItems = [
  { id: 1, name: "ข้าวกะเพราไก่", price: 45, qty: 1 },
  { id: 2, name: "ข้าวไข่เจียว", price: 35, qty: 1 }
];

export default function CartPage() {
  const navigate = useNavigate();
  const food = 80;
  const fee = 10;

  return (
    <div>
      <Link to="/customer" className="back-link">
        <ArrowLeft size={18} /> กลับ
      </Link>

      <SectionTitle title="ตะกร้าของฉัน" subtitle="ครัวหลังมอ" />

      <div className="card-stack">
        {cartItems.map((item) => (
          <div className="cart-row" key={item.id}>
            <div>
              <h3>{item.name}</h3>
              <strong>{item.price} บาท</strong>
            </div>
            <div className="qty">
              <button>
                <Minus size={15} />
              </button>
              <span>{item.qty}</span>
              <button>
                <Plus size={15} />
              </button>
            </div>
            <button className="ghost-danger">
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>

      <div className="address-card">
        <MapPin size={20} />
        <div>
          <small>จัดส่งที่</small>
          <strong>หอพักมหาวิทยาลัย มจพ.</strong>
          <span>รายละเอียดที่อยู่จัดส่งของคุณ</span>
        </div>
        <button>เปลี่ยน</button>
      </div>

      <div className="summary-card">
        <div>
          <span>ค่าอาหาร</span>
          <b>{food} บาท</b>
        </div>
        <div>
          <span>ค่าจัดส่ง</span>
          <b>{fee} บาท</b>
        </div>
        <hr />
        <div className="total">
          <span>รวมทั้งหมด</span>
          <strong>{food + fee} บาท</strong>
        </div>
      </div>

      <button
        className="primary-btn full"
        onClick={() => navigate("/customer/orders")}
      >
        สั่งอาหาร {food + fee} บาท
      </button>
    </div>
  );
}