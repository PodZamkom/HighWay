"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import type { ContentPage } from "@/types/content-pages";
import { MetricCards } from "@/components/content-pages/MetricCards";
import { SectionBlock } from "@/components/content-pages/SectionBlock";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import type { BreadcrumbItem } from "@/lib/breadcrumbs";

interface PageShellProps {
  page: ContentPage;
  breadcrumbs: BreadcrumbItem[];
}

function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://") || href.startsWith("tel:");
}

function ActionLink({ label, href }: { label: string; href: string }) {
  const className =
    "inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black tracking-wide transition-colors";

  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noreferrer" : undefined}
        className={`${className} bg-[#ff5a00] text-white hover:bg-[#ff7429]`}
      >
        {label}
        <ArrowUpRight size={16} />
      </a>
    );
  }

  return (
    <Link href={href} className={`${className} bg-[#ff5a00] text-white hover:bg-[#ff7429]`}>
      {label}
      <ArrowUpRight size={16} />
    </Link>
  );
}

function SecondaryLink({ label, href }: { label: string; href: string }) {
  const className =
    "inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/5";

  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noreferrer" : undefined}
        className={className}
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export function PageShell({ page, breadcrumbs }: PageShellProps) {
  return (
    <div className="bg-[#0f0f10] pb-16 text-[#e8e8e8]">
      <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_10%_20%,rgba(255,90,0,0.20),transparent_38%),radial-gradient(circle_at_88%_15%,rgba(255,255,255,0.08),transparent_35%),#111112]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <Breadcrumbs items={breadcrumbs} tone="dark" className="mb-5 sm:mb-6" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff8f55]">{page.hero.eyebrow}</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              {page.hero.title}
            </h1>
            {page.hero.subtitle ? (
              <p className="mt-4 max-w-3xl text-xl font-semibold text-[#ececec] sm:text-2xl">{page.hero.subtitle}</p>
            ) : null}
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-[#c8c8c8] sm:text-lg">{page.hero.description}</p>

            {page.hero.tags?.length ? (
              <div className="mt-6 flex flex-wrap gap-2.5">
                {page.hero.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#e8e8e8]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              {page.hero.primaryCta ? <ActionLink label={page.hero.primaryCta.label} href={page.hero.primaryCta.href} /> : null}
              {page.hero.secondaryCta ? (
                <SecondaryLink label={page.hero.secondaryCta.label} href={page.hero.secondaryCta.href} />
              ) : null}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto mt-8 max-w-7xl space-y-7 px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#171717] px-5 py-4 text-sm text-[#b3b3b3]">{page.sourceNote}</div>

        {page.metricsSection ? (
          <SectionBlock title={page.metricsSection.title} description={page.metricsSection.description}>
            <MetricCards metrics={page.metricsSection.items} />
          </SectionBlock>
        ) : null}

        {page.bulletSections?.map((section) => (
          <SectionBlock key={section.id} id={section.id} title={section.title} description={section.description}>
            <ul className="grid gap-3 sm:grid-cols-2">
              {section.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-relaxed text-[#dbdbdb]"
                >
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#ff7a33]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </SectionBlock>
        ))}

        {page.stepsSections?.map((section) => (
          <SectionBlock key={section.id} id={section.id} title={section.title} description={section.description}>
            <div className="grid gap-4 lg:grid-cols-2">
              {section.items.map((item) => (
                <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#c5c5c5]">{item.description}</p>
                </article>
              ))}
            </div>
          </SectionBlock>
        ))}

        {page.casesSection ? (
          <SectionBlock id={page.casesSection.id} title={page.casesSection.title} description={page.casesSection.description}>
            <div className="grid gap-4 lg:grid-cols-3">
              {page.casesSection.items.map((item) => (
                <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  {item.meta ? (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#ff985d]">{item.meta}</p>
                  ) : null}
                  <p className="mt-3 text-sm leading-relaxed text-[#c5c5c5]">{item.description}</p>
                </article>
              ))}
            </div>
          </SectionBlock>
        ) : null}

        {page.faqSection ? (
          <SectionBlock id={page.faqSection.id} title={page.faqSection.title} description={page.faqSection.description}>
            <div className="space-y-3">
              {page.faqSection.items.map((item) => (
                <details key={item.question} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 open:bg-white/[0.04]">
                  <summary className="cursor-pointer list-none pr-5 text-base font-bold text-white">{item.question}</summary>
                  <p className="mt-3 text-sm leading-relaxed text-[#c5c5c5]">{item.answer}</p>
                </details>
              ))}
            </div>
          </SectionBlock>
        ) : null}

        {page.contactsSection ? (
          <SectionBlock
            id={page.contactsSection.id}
            title={page.contactsSection.title}
            description={page.contactsSection.description}
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[#ff8e55]">Телефоны и каналы связи</h3>
                <div className="mt-4 space-y-3">
                  {page.contactsSection.methods.map((item) => (
                    <article key={`${item.label}-${item.value}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9e9e9e]">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="mt-1 inline-block text-lg font-bold text-white transition-colors hover:text-[#ff8e55]">
                          {item.value}
                        </a>
                      ) : (
                        <p className="mt-1 text-lg font-bold text-white">{item.value}</p>
                      )}
                      {item.note ? <p className="mt-1 text-xs text-[#b8b8b8]">{item.note}</p> : null}
                    </article>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {page.contactsSection.links?.length ? (
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[#ff8e55]">Ссылки</h3>
                    <div className="mt-4 space-y-3">
                      {page.contactsSection.links.map((item) => (
                        <article key={`${item.label}-${item.value}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9e9e9e]">{item.label}</p>
                          {item.href ? (
                            <a
                              href={item.href}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-block text-base font-bold text-white transition-colors hover:text-[#ff8e55]"
                            >
                              {item.value}
                            </a>
                          ) : (
                            <p className="mt-1 text-base font-bold text-white">{item.value}</p>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}

                {page.contactsSection.offices?.length ? (
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[#ff8e55]">Офисы</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {page.contactsSection.offices.map((office) => (
                        <article key={`${office.city}-${office.address}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-sm font-black text-white">{office.city}</p>
                          <p className="mt-1 text-sm text-[#c8c8c8]">{office.address}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </SectionBlock>
        ) : null}

        <section className="rounded-3xl border border-[#3b2b22] bg-[linear-gradient(135deg,#23160f,#151515)] p-7 sm:p-9">
          <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{page.cta.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#d1d1d1] sm:text-base">{page.cta.description}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ActionLink label={page.cta.primary.label} href={page.cta.primary.href} />
            {page.cta.secondary ? <SecondaryLink label={page.cta.secondary.label} href={page.cta.secondary.href} /> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
