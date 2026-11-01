import { TrendingUp, ShoppingBag, Banknote } from "lucide-react";
import SectionTitle from "../../components/SectionTitle";
import StatCard from "../../components/StatCard";

export default function Reports() {
  return (
    <div>
      <SectionTitle
        title="รายงานรายได้"
        subtitle="ดูยอดขายและประสิทธิภาพร้านค้า"
      />

      <div className="period-buttons">
        <button className="active">วันนี้</button>
        <button>7 วัน</button>
        <button>30 วัน</button>
      </div>

      <div className="stat-grid three">
        <StatCard icon={Banknote} label="รายได้รวม" value="1,560 บาท" hint="+12%" />
        <StatCard icon={ShoppingBag} label="ออเดอร์ทั้งหมด" value="24" hint="+5" />
        <StatCard icon={TrendingUp} label="ค่าเฉลี่ย / ออเดอร์" value="65 บาท" hint="ทรงตัว" />
      </div>

      <div className="card">
        <h3>ยอดขายรายชั่วโมง</h3>
        <div className="fake-chart large">
          {[24, 40, 32, 58, 64, 80, 50, 70, 92, 77].map((height, index) => (
            <div className="bar" style={{ height: `${height}%` }} key={index}>
              <span>{9 + index}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}