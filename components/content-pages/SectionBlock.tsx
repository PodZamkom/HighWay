import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface SectionBlockProps {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function SectionBlock({ id, title, description, children }: SectionBlockProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="rounded-3xl border border-[#2b2b2b] bg-[#141414] p-6 shadow-[0_26px_50px_-35px_rgba(0,0,0,0.85)] sm:p-8"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{title}</h2>
        {description ? <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#b6b6b6] sm:text-base">{description}</p> : null}
      </div>
      {children}
    </motion.section>
  );
}
