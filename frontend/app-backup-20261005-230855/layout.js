import "./globals.css";

export const metadata = {
  title: "Behind NB",
  description: "Hyperlocal P2P Food Delivery สำหรับชาว มจพ."
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}