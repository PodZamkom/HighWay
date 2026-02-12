"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CirclePlay, Instagram, MessageCircleMore, Send, Star } from "lucide-react";

const HIGHLIGHTS = [
  { label: "Экономия от", value: "10-15% стоимости авто" },
  { label: "Доставка от", value: "60 рабочих дней" },
  { label: "Экспертиза", value: "14 лет на рынке" },
  { label: "Репутация", value: "1500 отзывов" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#f2f3f5]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(255,122,30,0.06),transparent_35%),radial-gradient(circle_at_100%_0%,rgba(8,65,149,0.08),transparent_32%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.03fr)]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-[42rem]"
          >
            <h1 className="text-4xl font-black tracking-tight text-[#16181f] sm:text-5xl lg:text-[52px]">
              АВТО ИЗ США
            </h1>

            <p className="mt-4 text-lg font-semibold leading-snug text-[#171a21] sm:text-2xl lg:text-[30px]">
              Хотите выгодно купить бу автомобиль из Америки
              <br />
              с доставкой в Беларусь?{" "}
              <span className="font-black text-[#d76d20]">HIGHWAYMOTORS</span> поможет!
            </p>

            <ul className="mt-7 space-y-2.5">
              {HIGHLIGHTS.map((item) => (
                <li key={item.label} className="flex items-center gap-2.5 text-base leading-snug text-[#242833] sm:text-lg">
                  <Star size={19} className="fill-[#e67e22] text-[#a24f08]" />
                  <span className="font-medium">{item.label}</span>
                  <span className="text-zinc-500">-</span>
                  <span className="text-zinc-600">{item.value}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <h2 className="text-2xl font-black text-[#171a21] sm:text-[30px]">Консультация эксперта</h2>
              <p className="mt-2 max-w-xl text-base leading-snug text-[#444b59] sm:text-lg">
                Перезвоним за 1 минуту и расскажем о выгодных авто.
                <br />
                Подберем лучшие варианты под ваш бюджет.
              </p>
            </div>

            <div className="mt-7">
              <Link
                href="#calculator"
                className="inline-flex items-center rounded-[14px] bg-gradient-to-b from-[#ff7d2e] to-[#ef5a12] px-8 py-4 text-sm font-black uppercase tracking-wide text-white shadow-[0_14px_22px_-12px_rgba(239,90,18,0.7)] transition hover:translate-y-[-1px] hover:from-[#ff873a] hover:to-[#f36a2b] sm:text-base"
              >
                Рассчитать стоимость
              </Link>
            </div>

            <div className="mt-7 flex items-center gap-3">
              <span className="text-sm font-medium text-[#535b6a] sm:text-base">Пишите нам:</span>
              <a
                href="https://wa.me/375447772224"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ff7c2c] text-white transition hover:bg-[#ec6518]"
                aria-label="WhatsApp"
              >
                <MessageCircleMore size={18} />
              </a>
              <a
                href="https://t.me/highwaymotors"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ff7c2c] text-white transition hover:bg-[#ec6518]"
                aria-label="Telegram"
              >
                <Send size={18} />
              </a>
              <a
                href="https://instagram.com/highwaymotors"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ff7c2c] text-white transition hover:bg-[#ec6518]"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.52, delay: 0.1 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-2xl border border-zinc-300 bg-[#151820] shadow-[0_35px_65px_-38px_rgba(0,0,0,0.95)]">
              <div className="absolute left-0 top-0 z-20 w-full bg-gradient-to-r from-[#1b6f2a] via-[#2e9e31] to-[#0f4618] px-6 py-3">
                <p className="text-2xl font-black uppercase tracking-wide text-white sm:text-[40px]">Авто под заказ</p>
                <p className="text-base font-bold uppercase text-emerald-100 sm:text-[22px]">Подбор и доставка</p>
              </div>

              <img
                src="/images/cars/ford/mustang_mach_e/main.webp"
                alt="Авто под заказ"
                className="aspect-[16/9] w-full object-cover object-center pt-[88px]"
              />

              <div className="absolute inset-0 z-20 flex items-center justify-center pt-16">
                <button
                  type="button"
                  className="inline-flex items-center rounded-full border border-white/30 bg-black/35 px-4 py-2 backdrop-blur-sm transition hover:bg-black/45"
                  aria-label="Смотреть видео"
                >
                  <CirclePlay className="h-12 w-12 fill-[#ff4f00] text-[#ff4f00]" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
