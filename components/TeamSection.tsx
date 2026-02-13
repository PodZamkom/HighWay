import Image from "next/image";

const TEAM_MEMBERS = [
  {
    name: "Эксперт по подбору",
    role: "Аналитика лотов и проверка истории авто",
    image: "/images/team/member-1.webp",
    accentFrom: "rgba(255,106,26,0.85)",
    accentTo: "rgba(255,141,69,0.70)",
  },
  {
    name: "Менеджер по доставке",
    role: "Логистика и контроль каждого этапа пути",
    image: "/images/team/member-2.webp",
    accentFrom: "rgba(31,107,255,0.85)",
    accentTo: "rgba(75,141,255,0.70)",
  },
  {
    name: "Клиентский сервис",
    role: "Коммуникация, документы и финальный расчет",
    image: "/images/team/member-3.webp",
    accentFrom: "rgba(19,161,111,0.85)",
    accentTo: "rgba(60,196,145,0.70)",
  },
];

export function TeamSection() {
  return (
    <section className="relative overflow-hidden bg-[#0f1724] py-20 sm:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#ff5a00]/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#1f6bff]/25 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-5 sm:mb-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9ca7bd]">Highway Motors</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Наша команда</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#c4ccdb] sm:text-base">
              Люди, которые ведут сделку от выбора лота до передачи автомобиля вам в Беларуси.
            </p>
          </div>
          <span className="hidden rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#dbe2f2] sm:inline-flex">
            14+ лет опыта
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {TEAM_MEMBERS.map((member) => (
            <article
              key={member.image}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#151f30] shadow-[0_24px_48px_-28px_rgba(0,0,0,0.8)]"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover object-top transition duration-500 group-hover:scale-[1.03]"
                />
                <div
                  className="absolute inset-x-0 top-0 h-24"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, ${member.accentFrom}, ${member.accentTo})`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1724] via-[#0f1724]/10 to-transparent" />
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#b5c0d6]">Highway Motors</p>
                <h3 className="mt-1 text-xl font-black text-white">{member.name}</h3>
                <p className="mt-1.5 text-sm text-[#d4dbea]">{member.role}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
