import type { Metadata, Viewport } from "next";
import "./globals.css";
import { FunctionGuide } from "@/components/function-guide";
import { ProductIntelligenceProvider } from "@/components/product-intelligence-provider";

export const metadata: Metadata = {
  title: { default: "El Facto Noticias", template: "%s · El Facto Noticias" },
  description: "Noticias, análisis y contexto con claridad editorial.",
  applicationName: "El Facto Noticias",
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#f3f2ed",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body><ProductIntelligenceProvider>{children}<FunctionGuide /></ProductIntelligenceProvider></body></html>;
}
