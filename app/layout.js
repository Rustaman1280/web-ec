import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata = {
  title: "EC Realtime Quiz Platform",
  description: "Interactive real-time quiz for the English Club",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
