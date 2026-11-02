import "./globals.css";

export const metadata = {
  title: "Behind NB",
  description: "Behind North Bangkok",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
