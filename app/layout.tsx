import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getSiteContent } from "@/lib/data";
import Script from "next/script";



export async function generateMetadata(): Promise<Metadata> {
    const { seo } = await getSiteContent();
    return {
        metadataBase: new URL('https://reply.teleforge.ru'),
        title: seo.title,
        description: seo.description,
        keywords: seo.keywords,
        openGraph: seo.ogImage ? {
            images: [seo.ogImage]
        } : undefined
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
            <body className="antialiased min-h-screen flex flex-col">
                <Navbar content={siteContent.navbar} />
                <main className="flex-grow">
                    {children}
                </main>
                <Footer content={siteContent.footer} />
                {/* Oryntix Live Chat */}
                <Script
                    src="https://staging.oryntix.ru/api/live-chat/widget.js?key=lc_ad8vORyLzJgi3QfVo14NTS54"
                    strategy="afterInteractive"
                />
            </body>
        </html>
    );
}
