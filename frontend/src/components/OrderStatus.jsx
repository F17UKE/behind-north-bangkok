import Badge from "./Badge";

const tones = {
  "รอรับออเดอร์": "yellow",
  "กำลังทำอาหาร": "orange",
  "รอรับอาหาร": "blue",
  "เสร็จสิ้น": "green",
  "ยกเลิก": "red"
};

export default function OrderStatus({ status }) {
  return <Badge tone={tones[status] || "gray"}>{status}</Badge>;
}