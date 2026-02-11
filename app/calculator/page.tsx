import { LandingPriceCalculator } from "@/components/calculator/LandingPriceCalculator";
import { Calculator, Truck, FileCheck, Shield, ChevronRight, MessageCircle } from "lucide-react";

export const metadata = {
    title: 'Калькулятор растаможки авто из Китая в Беларусь 2025 | Highway Motors',
    description: 'Рассчитайте точную стоимость автомобиля из Китая под ключ в Минске. Калькулятор учитывает таможенные пошлины, логистику, утильсбор и все расходы.',
};

export default function CalculatorPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            {/* Hero */}
            <section className="relative pt-28 pb-16 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-red-950/30 via-black to-black" />
                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
                        <a href="/" className="hover:text-white transition-colors">Главная</a>
                        <ChevronRight size={14} />
                        <span className="text-red-400">Калькулятор расходов</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">
                        Калькулятор растаможки авто из Китая{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                            в Беларусь 2025
                        </span>
                    </h1>
                    <p className="text-zinc-400 text-sm max-w-3xl leading-relaxed">
                        Расчёт произведён по тарифам, действующим на момент расчёта. Полученные значения являются ориентировочными
                        и не могут рассматриваться как основание для оплаты или юридически значимый документ.
                        Актуальные данные вы всегда можете уточнить у менеджера.
                    </p>
                </div>
            </section>

            {/* Calculator */}
            <section className="px-4 pb-20">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl">
                        <LandingPriceCalculator />
                    </div>
                </div>
            </section>

            {/* Что учитывает калькулятор */}
            <section className="px-4 pb-20">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold mb-10">Что учитывает наш калькулятор</h2>
                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        Калькулятор растаможки создан на основе актуального законодательства Республики Беларусь
                        и практики доставки автомобилей из Китая в 2025 году. Он учитывает все ключевые параметры,
                        влияющие на окончательную стоимость автомобиля.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Calculator size={20} className="text-red-500" />
                                Основные параметры
                            </h3>
                            <ul className="space-y-3 text-sm text-zinc-400">
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 mt-1">•</span>
                                    <span><strong className="text-white">Тип двигателя</strong> — электро (EV), гибрид (EREV) или ДВС (ICE). Влияет на ставку пошлины.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 mt-1">•</span>
                                    <span><strong className="text-white">Стоимость авто ($)</strong> — цена автомобиля на площадке или у дилера в Китае (FOB).</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-500 mt-1">•</span>
                                    <span><strong className="text-white">Льгота (Указ 140)</strong> — 50% скидка на таможенные платежи для многодетных семей и инвалидов I-II группы.</span>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Shield size={20} className="text-red-500" />
                                Дополнительные опции
                            </h3>
                            <ul className="space-y-3 text-sm text-zinc-400">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-1">•</span>
                                    <span><strong className="text-white">Электромобиль</strong> — освобождён от таможенной пошлины в Республике Беларусь (0%).</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-500 mt-1">•</span>
                                    <span><strong className="text-white">Гибрид (EREV)</strong> — Li Auto, BYD DM-i и подобные. Пошлина 15% + НДС 20%.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span><strong className="text-white">ДВС (ICE)</strong> — стандартная пошлина 15% + НДС 20% (юрлица) или единый платёж 48% (физлица).</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Как формируется стоимость */}
            <section className="px-4 pb-20">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold mb-10">Как формируется итоговая стоимость авто из Китая</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Раздел 1 */}
                        <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                                    <Truck size={20} className="text-red-500" />
                                </div>
                                <h3 className="text-lg font-semibold">Раздел 1: Покупка и доставка</h3>
                            </div>
                            <ol className="space-y-4 text-sm text-zinc-400">
                                <li className="flex gap-3">
                                    <span className="text-red-500 font-bold">1.</span>
                                    <div>
                                        <strong className="text-white">Стоимость авто</strong>
                                        <p className="mt-1">Цена автомобиля на площадке или у дилера в Китае.</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-red-500 font-bold">2.</span>
                                    <div>
                                        <strong className="text-white">Аукционный сбор</strong>
                                        <p className="mt-1">Комиссия площадки за оформление покупки (~$500).</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-red-500 font-bold">3.</span>
                                    <div>
                                        <strong className="text-white">Логистика по Китаю</strong>
                                        <p className="mt-1">Транспортировка со склада до порта отправки.</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-red-500 font-bold">4.</span>
                                    <div>
                                        <strong className="text-white">Доставка Китай → Минск</strong>
                                        <p className="mt-1">ЖД или автовоз до Беларуси (~$2,800).</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-red-500 font-bold">5.</span>
                                    <div>
                                        <strong className="text-white">Услуги Highway Motors</strong>
                                        <p className="mt-1">Подбор, проверка автомобиля, сопровождение сделки.</p>
                                    </div>
                                </li>
                            </ol>
                        </div>

                        {/* Раздел 2 */}
                        <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                                    <FileCheck size={20} className="text-red-500" />
                                </div>
                                <h3 className="text-lg font-semibold">Раздел 2: Растаможка и оформление</h3>
                            </div>
                            <p className="text-sm text-zinc-400 mb-4">
                                При ввозе автомобиля из Китая в Республику Беларусь таможенные платежи
                                рассчитываются с учётом типа двигателя, стоимости и категории получателя.
                            </p>
                            <ul className="space-y-4 text-sm text-zinc-400">
                                <li className="flex gap-3">
                                    <span className="text-red-500 font-bold">•</span>
                                    <div>
                                        <strong className="text-white">Таможенная пошлина</strong>
                                        <p className="mt-1">EV — 0%. Гибрид/ДВС — 15% (юрлица) или до 48% (физлица).</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-red-500 font-bold">•</span>
                                    <div>
                                        <strong className="text-white">НДС (20%)</strong>
                                        <p className="mt-1">Начисляется на (стоимость + пошлина) для юридических лиц.</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-red-500 font-bold">•</span>
                                    <div>
                                        <strong className="text-white">Утилизационный сбор</strong>
                                        <p className="mt-1">До 3 лет — ~544 BYN. Старше 3 лет — ~1089 BYN (физлица).</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="text-red-500 font-bold">•</span>
                                    <div>
                                        <strong className="text-white">Таможенное оформление</strong>
                                        <p className="mt-1">Услуги брокера + сбор за таможенное оформление (~$500).</p>
                                    </div>
                                </li>
                            </ul>

                            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                <p className="text-green-400 text-sm font-medium">
                                    ⚡ Льгота: Электромобили освобождены от таможенной пошлины до конца 2025 года
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Что не входит */}
                    <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="font-semibold mb-3">Что не входит в расчёт</h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-zinc-400">
                            <li>• Комиссии за международные переводы и банковские платежи</li>
                            <li>• Ремонт автомобиля, если необходим</li>
                            <li>• Страхование (КАСКО, ОСАГО)</li>
                            <li>• Постановка на учёт в ГАИ</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Почему стоит использовать */}
            <section className="px-4 pb-20">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold mb-10">Почему стоит использовать наш калькулятор?</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                title: 'Прозрачность',
                                desc: 'Вы видите все статьи затрат — от покупки до получения авто в Минске.',
                                icon: '🔍',
                            },
                            {
                                title: 'Планирование',
                                desc: 'Заранее понимаете, во сколько обойдётся покупка автомобиля из Китая.',
                                icon: '📊',
                            },
                            {
                                title: 'Актуальность',
                                desc: 'Ставки и тарифы обновлены в соответствии с законодательством 2025 года.',
                                icon: '📅',
                            },
                            {
                                title: 'Без скрытых платежей',
                                desc: 'Честный расчёт — итоговая цена не изменится при оформлении.',
                                icon: '✅',
                            },
                        ].map((item) => (
                            <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                                <div className="text-3xl mb-4">{item.icon}</div>
                                <h3 className="font-semibold mb-2">{item.title}</h3>
                                <p className="text-sm text-zinc-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="px-4 pb-24">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-gradient-to-r from-red-950/50 to-orange-950/50 border border-red-500/20 rounded-3xl p-8 md:p-12 text-center">
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">Появились вопросы?</h2>
                        <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
                            Свяжитесь с нашим менеджером — поможем рассчитать точную стоимость
                            именно вашего автомобиля и ответим на все вопросы.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="https://wa.me/375447772224"
                                target="_blank"
                                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-xl transition-colors"
                            >
                                <MessageCircle size={20} />
                                Написать в WhatsApp
                            </a>
                            <a
                                href="tel:+375447772224"
                                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-xl transition-colors border border-white/10"
                            >
                                Позвонить
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
