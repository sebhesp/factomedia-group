import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Factomedia Group", template: "%s · Factomedia" },
  description: "Información clara, verificada y útil.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
