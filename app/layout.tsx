import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getSiteContent } from "@/lib/data";

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    const { seo } = await getSiteContent();
    return {
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
                <script src="https://staging.oryntix.ru/api/live-chat/widget.js?key=lc_adWIdg6tnh6h8yzd9kj3Q4YJ" async></script>
            </body>
        </html>
    );
}
