import SectionTitle from "../../components/SectionTitle";

export default function Settings() {
  return (
    <div>
      <SectionTitle
        title="ตั้งค่าร้าน"
        subtitle="ข้อมูลที่ลูกค้าจะเห็น"
      />

      <div className="card form-card">
        <div className="avatar-store">🍛</div>

        <label>
          ชื่อร้าน
          <input defaultValue="ครัวหลังมอ" />
        </label>

        <label>
          ประเภทร้าน
          <input defaultValue="อาหารตามสั่ง" />
        </label>

        <label>
          รายละเอียด
          <input defaultValue="อาหารตามสั่ง ราคานักศึกษา" />
        </label>

        <div className="two-col">
          <label>
            เวลาเปิด
            <input defaultValue="08:00" />
          </label>
          <label>
            เวลาปิด
            <input defaultValue="21:00" />
          </label>
        </div>

        <label>
          ที่อยู่ร้าน
          <input defaultValue="หลังมหาวิทยาลัย มจพ." />
        </label>

        <button className="primary-btn">บันทึกการเปลี่ยนแปลง</button>
      </div>
    </div>
  );
}