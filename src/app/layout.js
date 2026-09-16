import "./globals.css";

export const metadata = {
  title: "Nexus — Connect. Chat. Together.",
  description: "A premium real-time social chat platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}