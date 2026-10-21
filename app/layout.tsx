import type { Metadata, Viewport } from "next";
import "./globals.css";

const NOMBRE_NEGOCIO = "GraffAr"; // <- cámbialo por el nombre real

export const metadata: Metadata = {
  title: {
    default: `${NOMBRE_NEGOCIO} | Sistema de gestión`,
    template: `%s | ${NOMBRE_NEGOCIO}`,
  },
  description:
    "Sistema interno de gestión de trabajos, clientes, caja y stock para GraffAr.",
  applicationName: `${NOMBRE_NEGOCIO} - Gestión`,
  // Sistema privado: evita que los buscadores lo indexen.
  robots: {
    index: false,
    follow: false,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  appleWebApp: {
    title: NOMBRE_NEGOCIO,
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Mismo color que la sidebar (zinc-900): tiñe la barra del navegador en celular.
  themeColor: "#18181b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}