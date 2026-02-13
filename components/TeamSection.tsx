const TEAM_MEMBERS = [
  {
    name: "Илья",
    role: "Эксперт по подбору",
    bio: "Подбор авто, проверка лотов и оценка рисков перед покупкой.",
    image: "/images/team/member-1.jpeg",
    position: "object-[52%_46%]",
  },
  {
    name: "Сергей",
    role: "Менеджер логистики",
    bio: "Контролирует доставку, сроки и этапы движения авто до выдачи клиенту.",
    image: "/images/team/member-2.jpeg",
    position: "object-[51%_38%]",
  },
  {
    name: "Тома",
    role: "Клиентский сервис",
    bio: "Сопровождает клиента по всем вопросам сделки и документов.",
    image: "/images/team/member-3.jpeg",
    position: "object-[50%_28%]",
  },
];

export function TeamSection() {
  return (
    <section id="team" className="relative overflow-hidden bg-[#111111] py-20 sm:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-8 h-72 w-72 rounded-full bg-[#ffffff]/5 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#ffffff]/7 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)",
            backgroundSize: "26px 26px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5 sm:mb-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b8b8b8]">Highway Motors</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl">Наша команда</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#cfcfcf] sm:text-base">
              Специалисты, которые ведут сделку аккуратно и прозрачно: от подбора до передачи авто.
            </p>
          </div>
          <span className="inline-flex rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#ececec]">
            14+ лет опыта
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {TEAM_MEMBERS.map((member) => (
            <article
              key={member.image}
              className="group overflow-hidden rounded-2xl border border-white/15 bg-[#1a1a1a] shadow-[0_22px_50px_-32px_rgba(0,0,0,0.95)]"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  loading="lazy"
                  decoding="async"
                  className={`h-full w-full object-cover ${member.position} transition duration-500 group-hover:scale-[1.02]`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              </div>

              <div className="border-t border-white/10 p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a9a9a9]">Highway Motors</p>
                <h3 className="mt-1 text-3xl font-black text-white">{member.name}</h3>
                <p className="mt-1 text-base font-semibold text-[#f0f0f0]">{member.role}</p>
                <p className="mt-2 text-sm leading-snug text-[#d4d4d4]">{member.bio}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-white/15 bg-[#1a1a1a]/90 p-5 sm:p-6">
          <div className="grid gap-4 text-sm text-[#dddddd] sm:grid-cols-3 sm:text-base">
            <p><span className="font-black text-white">1500+</span> отзывов и повторных клиентов</p>
            <p><span className="font-black text-white">24/7</span> контроль статуса и этапов сделки</p>
            <p><span className="font-black text-white">100%</span> прозрачность расчета и сроков</p>
          </div>
        </div>
      </div>
    </section>
  );
}
