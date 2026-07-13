import type { Metadata } from "next";
import "./globals.css";
import { ProductIntelligenceProvider } from "@/components/product-intelligence-provider";

export const metadata: Metadata = {
  title: { default: "Factomedia Group", template: "%s · Factomedia" },
  description: "Información clara, verificada y útil.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body><ProductIntelligenceProvider>{children}</ProductIntelligenceProvider></body></html>;
}
