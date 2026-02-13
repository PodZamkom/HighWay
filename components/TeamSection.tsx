const TEAM_MEMBERS = [
  {
    name: "Артем",
    role: "Эксперт по подбору",
    bio: "Проверка лотов, просчет рисков и подбор авто под бюджет клиента.",
    image: "/images/team/member-1.jpeg",
    tone: "from-[#ff6a1a] via-[#ff7a2f] to-[#ff9654]",
    position: "object-[center_18%]",
    tags: ["Подбор", "Аукционы"],
  },
  {
    name: "Кристина",
    role: "Менеджер логистики",
    bio: "Ведет маршрут авто от порта до передачи в Беларуси и контролирует сроки.",
    image: "/images/team/member-2.jpeg",
    tone: "from-[#1668ff] via-[#2e7dff] to-[#5ea1ff]",
    position: "object-[center_20%]",
    tags: ["Логистика", "Документы"],
  },
  {
    name: "Анна",
    role: "Клиентский сервис",
    bio: "Сопровождает сделку, отвечает за коммуникацию и финальный расчет без сюрпризов.",
    image: "/images/team/member-3.jpeg",
    tone: "from-[#0f9f72] via-[#23b987] to-[#56d3a5]",
    position: "object-[center_16%]",
    tags: ["Сопровождение", "Сервис"],
  },
];

export function TeamSection() {
  return (
    <section id="team" className="relative overflow-hidden bg-[#080e19] py-20 sm:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-8 h-72 w-72 rounded-full bg-[#ff5a00]/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#296cff]/25 blur-3xl" />
        <div className="absolute -bottom-12 left-1/3 h-80 w-80 rounded-full bg-[#11a776]/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.55) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5 sm:mb-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9fb0cd]">Highway Motors</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl">Наша команда</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#c7d4eb] sm:text-base">
              Работаем как единый продакшн-цикл: подбор, проверка, доставка, документы и выдача.
            </p>
          </div>
          <span className="inline-flex rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#e3ebfb]">
            14+ лет опыта
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {TEAM_MEMBERS.map((member, index) => (
            <article
              key={member.image}
              className={[
                "group relative overflow-hidden rounded-2xl border border-white/15 bg-[#0f1726] shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]",
                index === 0 ? "lg:col-span-5 lg:row-span-2" : "lg:col-span-7",
              ].join(" ")}
            >
              <div className={`relative overflow-hidden ${index === 0 ? "aspect-[4/5]" : "aspect-[16/9] sm:aspect-[21/10]"}`}>
                <img
                  src={member.image}
                  alt={member.name}
                  loading="lazy"
                  decoding="async"
                  className={`h-full w-full object-cover ${member.position} transition duration-500 group-hover:scale-[1.04]`}
                />
                <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${member.tone} opacity-90`} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060c17] via-[#060c17]/30 to-transparent" />
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <div className="mb-3 flex flex-wrap gap-2">
                  {member.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/35 bg-black/35 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#eef3ff]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b8c8e3]">Highway Motors</p>
                <h3 className="mt-1 text-2xl font-black text-white">{member.name}</h3>
                <p className="mt-1 text-base font-semibold text-[#eef4ff]">{member.role}</p>
                <p className="mt-2 max-w-xl text-sm leading-snug text-[#d5deef]">{member.bio}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-white/15 bg-[#0f1726]/80 p-5 backdrop-blur-sm sm:p-6">
          <div className="grid gap-4 text-sm text-[#dde6f8] sm:grid-cols-3 sm:text-base">
            <p><span className="font-black text-white">1500+</span> отзывов и повторных клиентов.</p>
            <p><span className="font-black text-white">24/7</span> контроль статуса сделки и доставки.</p>
            <p><span className="font-black text-white">100%</span> прозрачность по бюджету и этапам.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
