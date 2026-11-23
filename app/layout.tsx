import type { Metadata } from "next";
import { headers } from "next/headers";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim() || requestHeaders.get("host");
  const validHost = host && /^[a-z\d.-]+(?::\d{1,5})?$/i.test(host);
  const localHost = host && /^(?:localhost|127\.0\.0\.1)(?::\d+)?$/i.test(host);
  return {
  ...(validHost ? { metadataBase: new URL(`${localHost ? "http" : "https"}://${host}`) } : {}),
  title: "Малярка43 — кузовной ремонт и покраска авто в Кирове",
  description: "Кузовной ремонт, покраска, сварка, восстановление после ДТП, стапельные работы и антикор. Киров, Ульяновская, 39/3. Данил: +7 (917) 777-61-39.",
  openGraph: {title: "Малярка43 — снова в форме", description: "Кузовной ремонт и покраска в Кирове. Оценка повреждений по фото.", locale: "ru_RU", type: "website", images: ["/images/hero.webp"]},
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
