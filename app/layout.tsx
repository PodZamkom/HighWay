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
        {/* Marquiz quiz loader */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w, d, s, o){
  var j = d.createElement(s); j.async = true; j.src = '//script.marquiz.ru/v2.js';j.onload = function() {
    if (document.readyState !== 'loading') Marquiz.init(o);
    else document.addEventListener("DOMContentLoaded", function() {
      Marquiz.init(o);
    });
  };
  d.head.insertBefore(j, d.head.firstElementChild);
})(window, document, 'script', {
    host: '//quiz.marquiz.ru',
    region: 'ru',
    id: '656763572016880025f93225',
    autoOpen: false,
    autoOpenFreq: 'once',
    openOnExit: false,
    disableOnMobile: false
  }
);`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        {bodyStartCounters.length > 0 ? <CountersHtml counters={bodyStartCounters} /> : null}
        {children}
        {bodyEndCounters.length > 0 ? <CountersHtml counters={bodyEndCounters} /> : null}
        {/* Marquiz banner (Pop) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(t, p) {window.Marquiz ? Marquiz.add([t, p]) : document.addEventListener('marquizLoaded', function() {Marquiz.add([t, p])})})('Pop', {id: '656763572016880025f93225', title: 'Сделать подбор', text: 'Edelivery', delay: 20, textColor: '#000000', bgColor: '#f4e4ba', svgColor: '#000000', closeColor: '#ffffff', bonusCount: 0, bonusText: false, type: 'side', position: 'position_top-left', rounded: true, shadow: true, blicked: true, pulse: false, symbolMode: 'icon', symbolIconId: 'rocket_launch', disableOnMobile: false})`,
          }}
        />
      </body>
    </html>
  );
}
