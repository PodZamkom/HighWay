"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CirclePlay, Instagram, MessageCircleMore, Send, Star } from "lucide-react";

const DEFAULT_HERO_YOUTUBE_SOURCE = "https://youtube.com/shorts/8zO8IhwdVWo";

function extractYoutubeId(source: string): string | null {
  const normalized = source.trim();
  if (!normalized) {
    return null;
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(normalized)) {
    return normalized;
  }

  const match = normalized.match(
    /(?:youtube\.com\/shorts\/|youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  );

  return match?.[1] ?? null;
}

const HIGHLIGHTS = [
  { label: "Экономия от", value: "10-15% стоимости авто" },
  { label: "Доставка от", value: "60 рабочих дней" },
  { label: "Экспертиза", value: "14 лет на рынке" },
  { label: "Репутация", value: "1500 отзывов" },
];

export function Hero() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const youtubeSource = process.env.NEXT_PUBLIC_HERO_YOUTUBE_ID ?? DEFAULT_HERO_YOUTUBE_SOURCE;
  const youtubeId = useMemo(() => extractYoutubeId(youtubeSource), [youtubeSource]);
  const embedUrl = useMemo(() => {
    if (!youtubeId) {
      return null;
    }

    const params = new URLSearchParams({
      autoplay: "1",
      controls: "1",
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
      hl: "ru",
    });

    return `https://www.youtube-nocookie.com/embed/${youtubeId}?${params.toString()}`;
  }, [youtubeId]);
  const thumbnailUrl = useMemo(() => {
    if (!youtubeId) {
      return "/images/cars/ford/mustang_mach_e/main.webp";
    }
    return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
  }, [youtubeId]);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#f8f9fa] via-[#f1f3f5] to-[#eceef1]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid items-center gap-9 lg:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-[41rem]"
          >
            <h1 className="text-4xl font-black tracking-tight text-[#141821] sm:text-5xl lg:text-[58px]">
              АВТО ИЗ США
            </h1>

            <p className="mt-3.5 text-[1.33rem] font-semibold leading-[1.18] text-[#171a21] sm:text-[1.65rem] lg:text-[2.03rem]">
              Хотите выгодно купить бу автомобиль из Америки
              <br />
              с доставкой в Беларусь?{" "}
              <span className="font-black text-[#e26717]">HIGHWAYMOTORS</span> поможет!
            </p>

            <ul className="mt-6 space-y-2.5">
              {HIGHLIGHTS.map((item) => (
                <li key={item.label} className="flex items-center gap-2.5 text-[1rem] leading-snug text-[#222631] sm:text-[1.09rem]">
                  <Star size={17} className="fill-[#e27b2a] text-[#ac5412]" />
                  <span className="font-medium">{item.label}</span>
                  <span className="text-zinc-500">-</span>
                  <span className="text-zinc-600">{item.value}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <h2 className="text-[1.95rem] font-black text-[#171a21] sm:text-[2.26rem]">Консультация эксперта</h2>
              <p className="mt-1.5 max-w-xl text-[1rem] leading-snug text-[#444b59] sm:text-[1.08rem]">
                Перезвоним за 1 минуту и расскажем о выгодных авто.
                <br />
                Подберем лучшие варианты под ваш бюджет.
              </p>
            </div>

            <div className="mt-8 relative inline-block group">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[#ff5a00] to-[#ff8c00] opacity-30 blur transition duration-500 group-hover:opacity-60"></div>
              <Link
                href="#calculator"
                className="relative inline-flex items-center rounded-xl bg-[#ff5a00] px-7 py-3 text-xs font-black uppercase tracking-wide text-white shadow-[0_8px_16px_-6px_rgba(255,90,0,0.5)] transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_12px_20px_-8px_rgba(255,90,0,0.6)] sm:px-8 sm:py-3.5 sm:text-[0.95rem]"
              >
                Рассчитать стоимость
              </Link>
            </div>

            <div className="mt-6 flex items-center gap-2.5">
              <span className="text-sm font-medium text-[#535b6a] sm:text-[0.95rem]">Пишите нам:</span>
              <a
                href="https://wa.me/375447772224"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ff5a00] text-white transition hover:bg-[#ff7429]"
                aria-label="WhatsApp"
              >
                <MessageCircleMore size={16} />
              </a>
              <a
                href="https://t.me/highwaymotors"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ff5a00] text-white transition hover:bg-[#ff7429]"
                aria-label="Telegram"
              >
                <Send size={16} />
              </a>
              <a
                href="https://instagram.com/highwaymotors"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ff5a00] text-white transition hover:bg-[#ff7429]"
                aria-label="Instagram"
              >
                <Instagram size={16} />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
            transition={{
              opacity: { duration: 0.6, delay: 0.2 },
              scale: { duration: 0.6, delay: 0.2 },
              y: { repeat: Infinity, duration: 6, ease: "easeInOut" }
            }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-2xl border border-[#d0d5df] bg-white shadow-[0_20px_36px_-24px_rgba(16,24,40,0.45)]">
              {isVideoOpen && embedUrl ? (
                <iframe
                  src={embedUrl}
                  title="Видео о подборе авто"
                  className="aspect-square w-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (embedUrl) {
                      setIsVideoOpen(true);
                    }
                  }}
                  className={`group relative block w-full ${embedUrl ? "cursor-pointer" : "cursor-default"}`}
                  aria-label={embedUrl ? "Смотреть видео" : "Видео пока недоступно"}
                >
                  <img
                    src={thumbnailUrl}
                    alt="Авто под заказ"
                    className="aspect-square w-full object-cover object-center"
                  />

                  <div className="absolute inset-0 bg-black/20" />

                  <div className="absolute inset-0 z-20 flex items-center justify-center">
                    <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#ff5a00] shadow-[0_12px_26px_-10px_rgba(255,90,0,0.8)] transition group-hover:scale-105">
                      <CirclePlay className="h-11 w-11 fill-white text-white" />
                    </span>
                  </div>
                </button>
              )}

            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
