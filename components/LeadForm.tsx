import React, { useState } from 'react';
import { Send, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { LeadFormData } from '../types';

export const LeadForm: React.FC = () => {
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    phone: '',
    preferredMessenger: 'telegram'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you! This is a demo. In production, this would send data to the CRM.');
  };

  return (
    <section id="contact" className="py-24 bg-black relative">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl relative overflow-hidden">
            
            {/* Gloss Effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-electricBlue/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-4">НАЧАТЬ ПОДБОР</h2>
                <p className="text-zinc-400">Оставьте заявку. Менеджер свяжется в течение 15 минут.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
                <div>
                    <input 
                        type="text" 
                        placeholder="Ваше имя"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-electricBlue transition-colors placeholder:text-zinc-600"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                    />
                </div>
                <div>
                    <input 
                        type="tel" 
                        placeholder="+375 (XX) XXX-XX-XX"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-electricBlue transition-colors placeholder:text-zinc-600"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => setFormData({...formData, preferredMessenger: 'telegram'})}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                            formData.preferredMessenger === 'telegram' 
                            ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                            : 'bg-black/40 border-white/10 text-zinc-500 hover:border-white/30'
                        }`}
                    >
                        <Send size={18} /> Telegram
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData({...formData, preferredMessenger: 'whatsapp'})}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                            formData.preferredMessenger === 'whatsapp' 
                            ? 'bg-green-500/20 border-green-500 text-green-400' 
                            : 'bg-black/40 border-white/10 text-zinc-500 hover:border-white/30'
                        }`}
                    >
                        <Smartphone size={18} /> WhatsApp
                    </button>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-colors mt-4"
                >
                    ПОЛУЧИТЬ РАСЧЕТ
                </motion.button>
            </form>
        </div>
      </div>
    </section>
  );
};