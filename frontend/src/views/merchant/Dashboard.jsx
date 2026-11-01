import { ClipboardList, Banknote, Clock3, TrendingUp } from "lucide-react";
import { stats, orders } from "../../data/mockData";
import StatCard from "../../components/StatCard";
import OrderStatus from "../../components/OrderStatus";
import SectionTitle from "../../components/SectionTitle";

export default function Dashboard() {
  return (
    <div>
      <SectionTitle
        title="สวัสดี 👋 ครัวหลังมอ"
        subtitle="ภาพรวมร้านค้าของคุณวันนี้"
      />

      <div className="stat-grid">
        <StatCard
          icon={ClipboardList}
          label="ออเดอร์วันนี้"
          value={stats.todayOrders}
          hint="+5 จากเมื่อวาน"
        />
        <StatCard
          icon={Banknote}
          label="รายได้วันนี้"
          value={`${stats.todayRevenue.toLocaleString()} บาท`}
          hint="+12%"
        />
        <StatCard
          icon={Clock3}
          label="เวลาเฉลี่ย / ออเดอร์"
          value="14 นาที"
          hint="ดีขึ้น 2 นาที"
        />
        <StatCard
          icon={TrendingUp}
          label="คะแนนร้าน"
          value="4.8 / 5"
          hint="120 รีวิว"
        />
      </div>

      <div className="dashboard-grid">
        <section className="card">
          <SectionTitle
            title="ออเดอร์ล่าสุด"
            action={<a href="/merchant/orders" className="text-link">ดูทั้งหมด</a>}
          />

          <div className="table-list">
            {orders.map((o) => (
              <div className="list-row" key={o.id}>
                <div>
                  <strong>{o.id}</strong>
                  <p>{o.customer}</p>
                </div>
                <div>
                  <OrderStatus status={o.status} />
                  <b>{o.total} บาท</b>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <SectionTitle title="ยอดขาย 7 วัน" />
          <div className="fake-chart">
            {[35, 52, 44, 72, 60, 87, 68].map((height, index) => (
              <div className="bar" style={{ height: `${height}%` }} key={index}>
                <span>{index + 9}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}