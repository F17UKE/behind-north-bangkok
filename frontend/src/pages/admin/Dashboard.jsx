import { Users, Store, ClipboardList, Banknote } from "lucide-react";
import { stats, orders } from "../../data/mockData";
import StatCard from "../../components/StatCard";
import OrderStatus from "../../components/OrderStatus";
import SectionTitle from "../../components/SectionTitle";

export default function Dashboard() {
  return (
    <div>
      <SectionTitle
        title="ภาพรวมระบบ"
        subtitle="ข้อมูลสำคัญของ Behind NB วันนี้"
      />

      <div className="stat-grid">
        <StatCard icon={Users} label="ผู้ใช้ทั้งหมด" value={stats.totalUsers.toLocaleString()} hint="+5%" />
        <StatCard icon={Store} label="ร้านค้าทั้งหมด" value={stats.totalStores} hint="+3 ร้าน" />
        <StatCard icon={ClipboardList} label="ออเดอร์ทั้งหมด" value={stats.totalOrders} hint="+18 วันนี้" />
        <StatCard icon={Banknote} label="รายได้รวม" value={`${stats.totalRevenue.toLocaleString()} บาท`} hint="+12%" />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <SectionTitle title="จำนวนออเดอร์ 7 วัน" />
          <div className="fake-chart large">
            {[36, 55, 44, 78, 61, 89, 70].map((height, index) => (
              <div className="bar" style={{ height: `${height}%` }} key={index}>
                <span>{10 + index}/9</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <SectionTitle title="ออเดอร์ล่าสุด" />
          <div className="table-list">
            {orders.map((o) => (
              <div className="list-row" key={o.id}>
                <div>
                  <strong>{o.id}</strong>
                  <p>{o.store}</p>
                </div>
                <OrderStatus status={o.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}