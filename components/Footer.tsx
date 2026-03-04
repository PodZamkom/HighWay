import type { FooterContent } from '@/types/site';

interface FooterProps {
  content: FooterContent;
}

export function Footer({ content }: FooterProps) {
  return (
    <footer className="bg-[#1a1a1a] text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-center md:text-left">
        {/* Contact Info */}
        <div>
          <h3 className="text-white font-bold mb-4">Контакты</h3>
          <a href={content.contacts?.phoneLink} className="text-lg text-white hover:text-orange-500 transition-colors bg-white/10 px-4 py-2 rounded-lg inline-block mb-4">
            {content.contacts?.phone}
          </a>
          <br />
          <a href={content.contacts?.whatsapp} target="_blank" className="text-green-500 hover:text-green-400 transition-colors text-sm font-medium">
            Написать в WhatsApp
          </a>
        </div>

        {/* Offices */}
        <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {content.contacts?.offices.map((office: any) => (
            <div key={`${office.city}-${office.address}`} className="bg-white/5 p-4 rounded-xl border border-white/10">
              <h4 className="text-white font-bold mb-1">{office.city}</h4>
              <p className="text-sm">{office.address}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 text-center border-t border-white/10 pt-8">
        <p className="text-sm">{content.copyright}</p>
      </div>
    </footer>
  );
}
