import { LandingPriceCalculator } from '@/components/calculator/LandingPriceCalculator';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { buildBreadcrumbJsonLd, resolveNavigationLabel } from '@/lib/breadcrumbs';
import { getSiteContent } from '@/lib/data';

export const metadata = {
    title: 'Калькулятор растаможки авто из США в Беларусь 2026 | E-TRADE',
    description:
        'Рассчитайте ориентировочную стоимость покупки и доставки авто из США в Беларусь: аукционный сбор, логистика, растаможка, оформление и итоговая цена.',
};

export default async function CalculatorPage() {
    const siteContent = await getSiteContent();
    const currentLabel = resolveNavigationLabel(siteContent.navbar, '/calculator', 'Калькулятор расходов');
    const breadcrumbs = [
        { label: 'Главная', href: '/' },
        { label: currentLabel },
    ];
    const breadcrumbSchema = buildBreadcrumbJsonLd(breadcrumbs, '/calculator');

    return (
        <>
            <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
                <section className="px-4 pb-14 pt-28">
                    <div className="mx-auto max-w-6xl">
                        <Breadcrumbs items={breadcrumbs} tone="light" className="mb-5" />

                        <h1 className="mb-4 text-3xl font-semibold md:text-5xl">
                            Калькулятор растаможки авто из США в Беларусь 2026
                        </h1>

                        <p className="max-w-5xl text-sm leading-relaxed text-slate-600 md:text-base">
                            Расчёт произведён по тарифам, действующим на момент расчёта. Полученные значения являются
                            ориентировочными и не могут рассматриваться как основание для оплаты или юридически значимый
                            документ. Обратите внимание, что данные могут сохраняться в кэше браузера. Для получения
                            самой свежей информации обновите страницу (Ctrl + F5) или очистите кэш. Актуальные данные вы
                            всегда можете уточнить у менеджера.
                        </p>

                        <div className="mt-10 rounded-3xl border border-slate-200 bg-[#f6f6f7] p-5 md:p-8">
                            <LandingPriceCalculator content={siteContent.calculator.form} />
                        </div>
                    </div>
                </section>

                <section className="px-4 pb-20">
                    <div className="mx-auto max-w-6xl text-slate-700">
                        <h2 className="mb-5 text-3xl font-semibold text-slate-900">Что учитывает наш калькулятор</h2>
                        <p className="mb-5 text-lg leading-relaxed">
                            Калькулятор растаможки создан на основе актуального законодательства Республики Беларусь и
                            практики доставки автомобилей. Он учитывает ключевые параметры, влияющие на окончательную
                            стоимость автомобиля.
                        </p>

                        <p className="mb-2 text-lg font-medium text-slate-900">Основные параметры:</p>
                        <ul className="list-disc space-y-1 pl-5 text-base">
                            <li>Тип транспорта и категория ТС.</li>
                            <li>Стоимость авто на аукционе.</li>
                            <li>Возраст авто и объём двигателя.</li>
                            <li>Площадка, аукцион и точка доставки.</li>
                        </ul>

                        <p className="mb-2 mt-6 text-lg font-medium text-slate-900">Дополнительные опции:</p>
                        <ul className="list-disc space-y-1 pl-5 text-base">
                            <li>Льготная растаможка.</li>
                        </ul>
                    </div>
                </section>
            </div>
            {breadcrumbSchema ? (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            ) : null}
        </>
    );
}
