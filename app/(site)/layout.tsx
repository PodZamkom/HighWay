import type { Metadata } from "next";
import Script from "next/script";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { resolveSiteUrl, toAbsoluteUrl } from "@/lib/breadcrumbs";
import { getSiteContent } from "@/lib/site/siteContentReadService";

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getSiteContent();
  const siteUrl = resolveSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: toAbsoluteUrl("/"),
      images: seo.ogImage ? [seo.ogImage] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: seo.ogImage ? [seo.ogImage] : undefined,
    },
  };
}

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteContent = await getSiteContent();
  const customChatSrc = process.env.NEXT_PUBLIC_CHAT_WIDGET_SRC?.trim() || "";
  const jivoWidgetId = process.env.NEXT_PUBLIC_JIVO_WIDGET_ID?.trim() || "";
  const resolvedChatSrc = customChatSrc || (jivoWidgetId ? `https://code.jivo.ru/widget/${jivoWidgetId}` : "");

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900">
      <Navbar content={siteContent.navbar} />
      <main className="flex-grow">{children}</main>
      <Footer content={siteContent.footer} />

      {resolvedChatSrc ? (
        <Script
          src={resolvedChatSrc}
          async
          strategy="afterInteractive"
        />
      ) : null}
    </div>
  );
}
