import type { Metadata, Viewport } from "next";
import "./globals.css";
import { FunctionGuide } from "@/components/function-guide";
import { ProductIntelligenceProvider } from "@/components/product-intelligence-provider";

export const metadata: Metadata = {
  title: { default: "Factomedia Group", template: "%s · Factomedia" },
  description: "Información clara, verificada y útil.",
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
