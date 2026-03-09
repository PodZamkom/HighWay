import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildBreadcrumbJsonLd, resolveNavigationLabel, toAbsoluteUrl } from "@/lib/breadcrumbs";
import {
  getPublicNewsBySlug,
  getPublicNewsSettings,
  getPublicRelatedNews,
} from "@/lib/news/newsPublicReadService";
import { getSiteContent } from "@/lib/site/siteContentReadService";

function collectArticleBody(blocks: Array<{ type: string; body?: string; quote?: string }>) {
  return blocks
    .map((block) => {
      if (block.type === "text") return block.body || "";
      if (block.type === "quote") return block.quote || "";
      return "";
    })
    .join("\n")
    .trim();
}

async function loadNews(slug: string) {
  return getPublicNewsBySlug(slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [post, settings] = await Promise.all([loadNews(slug), getPublicNewsSettings()]);

  if (!post) {
    return {
      title: "Новость не найдена",
      robots: "noindex,follow",
    };
  }

  const title = post.seoOverride.title || `${post.title} | Новости`;
  const description = post.seoOverride.description || post.excerpt || post.lead;
  const canonical = post.seoOverride.canonical || `/novosti/${post.slug}`;
  const ogImage = post.seoOverride.ogImage || post.cover?.url || settings.seo.ogImage;
  const keywords = post.seoOverride.keywords || settings.seo.keywords;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: toAbsoluteUrl(canonical),
      images: ogImage ? [ogImage] : undefined,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, settings, siteContent] = await Promise.all([loadNews(slug), getPublicNewsSettings(), getSiteContent()]);

  if (!post) {
    notFound();
  }

  const [related] = await Promise.all([getPublicRelatedNews(post.slug, post.category, 3)]);

  const listLabel = resolveNavigationLabel(siteContent.navbar, "/novosti", settings.pageTitle);
  const breadcrumbs = [
    { label: "Главная", href: "/" },
    { label: listLabel, href: "/novosti" },
    { label: post.title },
  ];

  const canonical = post.seoOverride.canonical || `/novosti/${post.slug}`;
  const breadcrumbSchema = buildBreadcrumbJsonLd(breadcrumbs, canonical);
  const articleBody = collectArticleBody(post.blocks as Array<{ type: string; body?: string; quote?: string }>);

  const newsArticleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.seoOverride.description || post.excerpt || post.lead,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    articleSection: post.category || undefined,
    keywords: post.tags.join(", ") || undefined,
    image: post.cover?.url ? [post.cover.url] : undefined,
    articleBody: articleBody || undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": toAbsoluteUrl(canonical),
    },
    publisher: {
      "@type": "Organization",
      name: siteContent.navbar.brandPrimary || "E-TRADE",
    },
  };

  const faqSchema = post.faq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: post.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }
    : null;

  const videoBlock = post.blocks.find((block) => block.type === "video") as
    | { embedUrl?: string; videoFile?: { url: string } | null }
    | undefined;

  const videoSchema = videoBlock
    ? {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: post.title,
        description: post.excerpt || post.lead,
        thumbnailUrl: post.cover?.url || undefined,
        uploadDate: post.publishedAt || post.createdAt,
        contentUrl: videoBlock.videoFile?.url || undefined,
        embedUrl: videoBlock.embedUrl || undefined,
      }
    : null;

  return (
    <div className="bg-[#0f0f10] pb-16 text-[#e8e8e8]">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_12%_18%,rgba(255,90,0,0.22),transparent_40%),radial-gradient(circle_at_88%_20%,rgba(255,255,255,0.08),transparent_36%),#111112]">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff8f55]">{post.category || "Новости"}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">{post.title}</h1>
          <p className="mt-5 text-base leading-relaxed text-[#c8c8c8] sm:text-lg">{post.lead}</p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-zinc-400">
            {post.publishedAt ? <span>{new Date(post.publishedAt).toLocaleDateString("ru-RU")}</span> : null}
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/15 px-2 py-0.5">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <article className="mx-auto mt-8 max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
        {post.cover?.url ? (
          <img src={post.cover.url} alt={post.cover.alt || post.title} className="w-full rounded-2xl border border-white/10 object-cover" />
        ) : null}

        <p className="text-lg leading-relaxed text-[#d4d4d4]">{post.excerpt}</p>

        {(post.blocks || []).map((block) => {
          if (block.type === "text") {
            return (
              <section key={block.id} className="rounded-2xl border border-white/10 bg-[#171717] p-5">
                {block.heading ? <h2 className="text-2xl font-bold text-white">{block.heading}</h2> : null}
                <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-[#d0d0d0]">{block.body}</p>
              </section>
            );
          }

          if (block.type === "image") {
            return (
              <figure key={block.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#171717]">
                <img src={block.image.url} alt={block.image.alt || post.title} className="w-full object-cover" />
                {block.caption ? <figcaption className="px-4 py-3 text-sm text-zinc-400">{block.caption}</figcaption> : null}
              </figure>
            );
          }

          if (block.type === "video") {
            return (
              <section key={block.id} className="space-y-3 rounded-2xl border border-white/10 bg-[#171717] p-4">
                {block.videoFile?.url ? (
                  <video controls className="w-full rounded-xl border border-white/10" src={block.videoFile.url} />
                ) : null}
                {block.embedUrl ? (
                  <div className="aspect-video overflow-hidden rounded-xl border border-white/10">
                    <iframe
                      src={block.embedUrl}
                      title={post.title}
                      className="h-full w-full"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : null}
                {block.caption ? <p className="text-sm text-zinc-400">{block.caption}</p> : null}
              </section>
            );
          }

          if (block.type === "quote") {
            return (
              <blockquote key={block.id} className="rounded-2xl border border-[#3b2b22] bg-[#171717] p-5">
                <p className="text-lg italic leading-relaxed text-[#f0f0f0]">“{block.quote}”</p>
                {block.author ? <footer className="mt-3 text-sm text-[#ff9a61]">— {block.author}</footer> : null}
              </blockquote>
            );
          }

          return null;
        })}

        {post.faq.length ? (
          <section className="rounded-2xl border border-white/10 bg-[#171717] p-5">
            <h2 className="text-2xl font-bold text-white">FAQ</h2>
            <div className="mt-4 space-y-3">
              {post.faq.map((item) => (
                <details key={item.question} className="rounded-xl border border-white/10 bg-black/20 p-4 open:bg-black/30">
                  <summary className="cursor-pointer text-base font-semibold text-white">{item.question}</summary>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        {post.cta ? (
          <section className="rounded-2xl border border-[#3b2b22] bg-[linear-gradient(135deg,#23160f,#151515)] p-6">
            <h2 className="text-2xl font-black text-white">{post.cta.title}</h2>
            {post.cta.description ? <p className="mt-3 text-sm text-zinc-300">{post.cta.description}</p> : null}
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={post.cta.primary.href} className="rounded-lg bg-[#ff5a00] px-4 py-2 text-sm font-black uppercase tracking-wide text-white hover:bg-[#ff7429]">
                {post.cta.primary.label}
              </Link>
              {post.cta.secondary ? (
                <Link href={post.cta.secondary.href} className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-white/40">
                  {post.cta.secondary.label}
                </Link>
              ) : null}
            </div>
          </section>
        ) : null}

        <div className="rounded-2xl border border-white/10 bg-[#171717] p-5">
          <Link href="/novosti" className="text-sm font-semibold text-[#ff995e] hover:text-[#ffb27f]">
            ← Назад к новостям
          </Link>
        </div>
      </article>

      {related.length ? (
        <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-white">Похожие новости</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {related.map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-[#171717] p-4">
                <p className="text-xs font-semibold uppercase text-[#ff9a61]">{item.category || "Новости"}</p>
                <h3 className="mt-2 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-zinc-300">{item.excerpt}</p>
                <Link href={`/novosti/${item.slug}`} className="mt-4 inline-flex text-sm font-semibold text-[#ff995e] hover:text-[#ffb27f]">
                  Читать
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {breadcrumbSchema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      ) : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleSchema) }} />
      {faqSchema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} /> : null}
      {videoSchema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }} /> : null}
    </div>
  );
}
