import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://malyarka43.closedlaugh2.chatgpt.site"),
  title: "Малярка43 — кузовной ремонт и покраска авто в Кирове",
  description: "Кузовной ремонт, покраска, сварка, восстановление после ДТП, стапельные работы и антикор. Киров, Ульяновская, 39/3. Данил: +7 (917) 777-61-39.",
  openGraph: {title: "Малярка43 — снова в форме", description: "Кузовной ремонт и покраска в Кирове. Оценка повреждений по фото.", locale: "ru_RU", type: "website", images: ["/images/hero.webp"]},
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

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
