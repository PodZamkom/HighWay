import React from 'react';
import { motion } from 'framer-motion';
import { MOCK_CARS } from '../constants';
import { MapPin, Zap } from 'lucide-react';

export const LiveFeed: React.FC = () => {
  return (
    <section className="py-24 bg-matteBlack">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]" />
                    ЛЕНТА ЗАКАЗОВ
                </h2>
                <p className="text-zinc-500">Автомобили в пути и недавние покупки наших клиентов</p>
            </div>
            <button className="text-electricBlue text-sm font-bold hover:text-white transition-colors border-b border-electricBlue hover:border-white pb-1">
                ПОСМОТРЕТЬ ВЕСЬ СПИСОК →
            </button>
        </div>

        {/* Uniform Grid with Creative Card Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_CARS.map((car, index) => (
            <motion.div
              key={car.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="group relative h-[400px] w-full bg-zinc-900 rounded-xl overflow-hidden border border-white/5 hover:border-electricBlue/50 transition-colors duration-500"
            >
              {/* Image with zoom effect */}
              <div className="absolute inset-0 overflow-hidden">
                <img 
                  src={car.imageUrl} 
                  alt={car.model} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter brightness-75 group-hover:brightness-100"
                />
              </div>

              {/* Status Badge */}
              <div className="absolute top-4 right-4 z-10">
                <div className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full backdrop-blur-md border ${
                    car.status === 'delivered' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                    car.status === 'transit' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                    'bg-zinc-800/80 text-zinc-300 border-white/10'
                }`}>
                    {car.status === 'delivered' ? 'ДОСТАВЛЕНО' : 
                     car.status === 'transit' ? 'В ПУТИ' : 
                     car.status === 'port' ? 'В ПОРТУ' : 'АУКЦИОН'}
                </div>
              </div>

              {/* Tech Overlay Details (Slide up on hover) */}
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black via-black/90 to-transparent transform translate-y-8 group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center gap-2 mb-1 text-electricBlue text-xs font-mono tracking-wider">
                    <MapPin size={12} /> {car.region}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-electricBlue transition-colors">{car.model}</h3>
                
                <div className="flex items-center justify-between border-t border-white/10 pt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    <div>
                        <span className="text-[10px] text-zinc-500 block uppercase tracking-widest">Цена под ключ</span>
                        <span className="text-lg font-mono text-white">${car.price.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] text-zinc-500 block uppercase tracking-widest">VIN CODE</span>
                        <span className="text-xs font-mono text-zinc-400">{car.vin}</span>
                    </div>
                </div>
                
                {/* Decorative Tech Lines */}
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-electricBlue group-hover:w-full transition-all duration-700" />
              </div>
            </motion.div>
          ))}
           {/* CTA Card for Uniformity */}
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="hidden lg:flex flex-col items-center justify-center h-[400px] bg-zinc-950 border border-dashed border-zinc-800 rounded-xl hover:border-zinc-600 transition-colors group cursor-pointer"
           >
              <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="text-electricBlue" />
              </div>
              <h3 className="text-white font-bold mb-2">Индивидуальный подбор</h3>
              <p className="text-zinc-500 text-sm text-center px-8">Найдем авто под ваши параметры</p>
           </motion.div>
        </div>
      </div>
    </section>
  );
};