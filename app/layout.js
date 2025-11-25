import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./blocknote-custom.css";
import ToastProvider from "@/components/providers/toast-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Sistema Legal - Gestión de Procesos",
  description: "Sistema de gestión legal para procesos judiciales",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider />
        {children}
        <div id="portal" />
      </body>
    </html>
  );
}
