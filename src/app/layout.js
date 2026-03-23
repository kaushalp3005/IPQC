import "./globals.css";

export const metadata = {
  title: "Candor QC - IPQC",
  description: "In-Process Quality Check System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
