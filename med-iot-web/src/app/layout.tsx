import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Med-IoT | Sistema de Monitoreo IoT",
  description: "Plataforma de monitoreo IoT en tiempo real con ESP32 y Firebase. Visualiza y analiza datos de tus sensores desde cualquier lugar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <Navbar />
          <main style={{ position: "relative", zIndex: 1 }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
