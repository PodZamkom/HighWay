import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { resolveSiteUrl, toAbsoluteUrl } from "@/lib/breadcrumbs";
import { getSiteContent } from "@/lib/data";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteContent = await getSiteContent();

  return (
    <html lang="ru">
      <body className="flex min-h-screen flex-col bg-white text-gray-900 antialiased">
        <Navbar content={siteContent.navbar} />
        <main className="flex-grow">{children}</main>
        <Footer content={siteContent.footer} />

        <Script
          src="https://staging.oryntix.ru/widget/430.js"
          async
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
