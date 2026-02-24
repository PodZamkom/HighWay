"use client";

import Link from "next/link";
import type { PromoBannerSection } from "@/types/site";

interface PromoBannersProps {
  content: PromoBannerSection;
}

export function PromoBanners({ content }: PromoBannersProps) {
  const [mainBanner, ...sideBanners] = content.banners;
  const gap = `${content.gapPx || 24}px`;

  if (!mainBanner) {
    return null;
  }

  return (
    <section className="bg-[#f2f3f5] pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1.9fr_1fr]" style={{ gap }}>
          <BannerCard banner={mainBanner} aspectClass="aspect-[16/9]" />

          <div className="grid gap-4" style={{ gap }}>
            {sideBanners.map((banner) => (
              <BannerCard key={banner.id} banner={banner} aspectClass="aspect-[16/8]" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BannerCard({
  banner,
  aspectClass,
}: {
  banner: PromoBannerSection["banners"][number];
  aspectClass: string;
}) {
  return (
    <Link
      href={banner.href}
      className={`group relative block overflow-hidden rounded-2xl border border-white/20 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.65)] ${aspectClass}`}
    >
      <img src={banner.image} alt={banner.alt} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />

      <div className="absolute inset-0 bg-gradient-to-tr from-[#0d121dcc] via-[#0d121d55] to-transparent" />

      <div className="absolute bottom-4 left-4 max-w-[72%] rounded-2xl border border-white/25 bg-black/30 p-4 backdrop-blur-sm sm:bottom-5 sm:left-5 sm:p-5">
        <p className="text-xl font-black leading-tight text-white sm:text-[1.9rem]">{banner.title}</p>
        <span className="mt-4 inline-flex rounded-lg bg-[#ff5a00] px-4 py-2 text-sm font-bold text-white transition group-hover:bg-[#ff7429]">
          {banner.buttonLabel}
        </span>
      </div>
    </Link>
  );
}
