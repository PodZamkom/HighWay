import type { FooterContent } from '@/types/site';

interface FooterProps {
  content: FooterContent;
}

export function Footer({ content }: FooterProps) {
  return (
    <footer className="border-t border-black/10 bg-white py-12 text-zinc-600 dark:border-white/10 dark:bg-black dark:text-white/50">
      <div className="mx-auto mb-8 grid max-w-7xl grid-cols-1 gap-8 px-4 text-center md:grid-cols-3 md:text-left">
        {/* Contact Info */}
        <div>
          <h3 className="mb-4 font-bold text-zinc-900 dark:text-white">Контакты</h3>
          <a href={content.contacts?.phoneLink} className="mb-4 inline-block rounded-lg bg-black/5 px-4 py-2 text-lg text-zinc-900 transition-colors hover:text-red-500 dark:bg-white/5 dark:text-white">
            {content.contacts?.phone}
          </a>
          <br />
          <a href={content.contacts?.whatsapp} target="_blank" className="text-sm font-medium text-green-600 transition-colors hover:text-green-500 dark:text-green-500 dark:hover:text-green-400">
            Написать в WhatsApp
          </a>
        </div>

        {/* Offices */}
        <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {content.contacts?.offices.map((office: any) => (
            <div key={office.city} className="rounded-xl border border-black/10 bg-black/5 p-4 dark:border-white/5 dark:bg-white/5">
              <h4 className="mb-1 font-bold text-zinc-900 dark:text-white">{office.city}</h4>
              <p className="text-sm">{office.address}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl border-t border-black/10 px-4 pt-8 text-center dark:border-white/5">
        <p className="text-sm">{content.copyright}</p>
        <p className="mt-2 text-xs">{content.tagline} <span className="text-zinc-500 dark:text-zinc-700">{content.version}</span></p>
      </div>
    </footer>
  );
}
