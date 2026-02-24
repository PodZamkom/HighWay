"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CirclePlay, Instagram, MessageCircleMore, Send, Star } from "lucide-react";
import type { HeroContent } from "@/types/site";

interface HeroProps {
  content: HeroContent;
}

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

export function Hero({ content }: HeroProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const youtubeSource = process.env.NEXT_PUBLIC_HERO_YOUTUBE_ID ?? content.youtubeSource;
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
      return content.fallbackImage;
    }
    return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
  }, [content.fallbackImage, youtubeId]);

  return (
    <section className="relative overflow-hidden bg-[#f2f3f5]">
      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-[41rem]"
          >
            <h1 className="text-3xl font-black tracking-tight text-[#141821] sm:text-4xl lg:text-[52px]">
              {content.title}
            </h1>

            <p className="mt-2.5 text-[1.1rem] font-semibold leading-[1.2] text-[#171a21] sm:text-[1.35rem] lg:text-[1.72rem]">
              {content.descriptionBeforeBrand}{" "}
              <span className="font-black text-[#e26717]">{content.brand}</span>
              {content.descriptionAfterBrand}
            </p>

            <ul className="mt-4 space-y-2">
              {content.highlights.map((item) => (
                <li key={item.label} className="flex items-center gap-2.5 text-[0.96rem] leading-snug text-[#222631] sm:text-[1.02rem]">
                  <Star size={16} className="fill-[#e27b2a] text-[#ac5412]" />
                  <span className="font-medium">{item.label}</span>
                  <span className="text-zinc-500">-</span>
                  <span className="text-zinc-600">{item.value}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <h2 className="text-[1.75rem] font-black text-[#171a21] sm:text-[2rem]">{content.consultationTitle}</h2>
              <p className="mt-1 max-w-xl text-[0.96rem] leading-snug text-[#444b59] sm:text-[1.02rem]">
                {content.consultationDescriptionLine1}
                <br />
                {content.consultationDescriptionLine2}
              </p>
            </div>

            <div className="mt-4">
              <Link
                href={content.primaryButtonHref}
                className="inline-flex items-center rounded-xl bg-[#ff5a00] px-7 py-3 text-xs font-black uppercase tracking-wide text-white shadow-[0_13px_20px_-12px_rgba(255,90,0,0.65)] transition hover:translate-y-[-1px] hover:bg-[#ff7429] sm:px-8 sm:py-3 sm:text-[0.9rem]"
              >
                {content.primaryButtonLabel}
              </Link>
            </div>

            <div className="mt-4 flex items-center gap-2.5">
              <span className="text-sm font-medium text-[#535b6a] sm:text-[0.92rem]">{content.contactsLabel}</span>
              <a
                href={content.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ff5a00] text-white transition hover:bg-[#ff7429]"
                aria-label="WhatsApp"
              >
                <MessageCircleMore size={16} />
              </a>
              <a
                href={content.telegramLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ff5a00] text-white transition hover:bg-[#ff7429]"
                aria-label="Telegram"
              >
                <Send size={16} />
              </a>
              <a
                href={content.instagramLink}
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
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.52, delay: 0.1 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-2xl border border-[#d0d5df] bg-white shadow-[0_20px_36px_-24px_rgba(16,24,40,0.45)]">
              {isVideoOpen && embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={content.videoTitle}
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
                    alt={content.videoTitle}
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
