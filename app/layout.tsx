import type { Metadata } from "next";
import "./globals.css";
import { getPublicAnalyticsCounters } from "@/lib/site/siteContentReadService";
import type { AnalyticsCounter } from "@/types/cms";

export const metadata: Metadata = {
  title: "E-TRADE | Авто из Китая, Европы и США",
  description: "E-TRADE — импорт и доставка автомобилей из Китая, США, Европы и Кореи в Беларусь. Честные цены, профессиональный подбор.",
  applicationName: "E-TRADE",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },
};

function pickEnabled(counters: AnalyticsCounter[], place: AnalyticsCounter["place"]): AnalyticsCounter[] {
  return counters.filter((counter) => counter.enabled && counter.place === place && counter.code.trim().length > 0);
}

function CountersHtml({ counters }: { counters: AnalyticsCounter[] }) {
  if (counters.length === 0) return null;
  const html = counters.map((counter) => counter.code).join("\n");
  return <div data-counters dangerouslySetInnerHTML={{ __html: html }} />;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { counters } = await getPublicAnalyticsCounters().catch(() => ({ counters: [] as AnalyticsCounter[] }));
  const headCounters = pickEnabled(counters, "head");
  const bodyStartCounters = pickEnabled(counters, "body-start");
  const bodyEndCounters = pickEnabled(counters, "body-end");

  return (
    <html lang="ru">
      <head>
        {headCounters.length > 0 ? <CountersHtml counters={headCounters} /> : null}
      </head>
      <body className="min-h-screen antialiased">
        {bodyStartCounters.length > 0 ? <CountersHtml counters={bodyStartCounters} /> : null}
        {children}
        {bodyEndCounters.length > 0 ? <CountersHtml counters={bodyEndCounters} /> : null}
      </body>
    </html>
  );
}
