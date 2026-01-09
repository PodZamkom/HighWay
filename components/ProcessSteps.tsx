import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  { id: '01', title: 'Заявка', desc: 'Консультация и подбор' },
  { id: '02', title: 'Договор', desc: 'Фиксация цены и условий' },
  { id: '03', title: 'Выкуп', desc: 'Оплата инвойса напрямую' },
  { id: '04', title: 'Логистика', desc: 'Доставка в Минск' },
];

export const ProcessSteps: React.FC = () => {
  return (
    <section id="process" className="py-24 bg-zinc-950 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-center text-3xl font-bold text-white mb-16">ПУТЬ ВАШЕГО АВТО</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-8 left-0 w-full h-px bg-zinc-800 -z-10" />

          {steps.map((step, index) => (
            <motion.div 
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative bg-zinc-950 pt-2" // bg to cover line
            >
                <div className="w-12 h-12 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-white font-mono font-bold mb-6 mx-auto md:mx-0 z-10 relative">
                    {step.id}
                    {index < steps.length - 1 && (
                        <div className="md:hidden absolute bottom-[-32px] left-1/2 w-px h-8 bg-zinc-800" />
                    )}
                </div>
                <div className="text-center md:text-left">
                    <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-zinc-500 text-sm">{step.desc}</p>
                </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};