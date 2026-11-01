import { BarChart3, Users, Store, Banknote } from "lucide-react";
import StatCard from "../../components/StatCard";
import SectionTitle from "../../components/SectionTitle";

export default function Reports() {
  return (
    <div>
      <SectionTitle
        title="รายงานและสถิติ"
        subtitle="วิเคราะห์ภาพรวมแพลตฟอร์ม"
      />

      <div className="period-buttons">
        <button className="active">7 วัน</button>
        <button>30 วัน</button>
        <button>6 เดือน</button>
        <button>1 ปี</button>
      </div>

      <div className="stat-grid">
        <StatCard icon={BarChart3} label="ออเดอร์เฉลี่ย / วัน" value="61" hint="+8%" />
        <StatCard icon={Banknote} label="รายได้ระบบ" value="28,560 บาท" hint="+12%" />
        <StatCard icon={Users} label="ผู้ใช้ใหม่" value="83" hint="+15%" />
        <StatCard icon={Store} label="ร้านค้าใหม่" value="6" hint="+2" />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>ออเดอร์ต่อวัน</h3>
          <div className="fake-chart large">
            {[30, 48, 52, 63, 42, 74, 88].map((height, index) => (
              <div className="bar" style={{ height: `${height}%` }} key={index}>
                <span>{10 + index}/9</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card ranking">
          <h3>ร้านยอดนิยม</h3>
          {["ครัวหลังมอ", "ข้าวมันไก่ลุงหนวด", "ชานมหลังมหาลัย"].map(
            (name, index) => (
              <div key={name}>
                <span>{index + 1}. {name}</span>
                <b>{[124, 98, 87][index]} ออเดอร์</b>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}