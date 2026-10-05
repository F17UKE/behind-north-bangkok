export default function Badge({ children, tone = "gray" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}