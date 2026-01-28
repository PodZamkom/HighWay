import type { FooterContent } from '@/types/site';

interface FooterProps {
  content: FooterContent;
}

export function Footer({ content }: FooterProps) {
  return (
    <footer className="bg-black text-white/50 py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm">{content.copyright}</p>
        <p className="text-xs mt-2">{content.tagline} <span className="text-zinc-700">{content.version}</span></p>
      </div>
    </footer>
  );
}