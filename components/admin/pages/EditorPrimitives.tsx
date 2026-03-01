import type { ReactNode } from "react";

interface TabButtonProps {
  active: boolean;
  dirty: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function TabButton({ active, dirty, onClick, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
        active
          ? "border-orange-500 bg-orange-500/20 text-white"
          : "border-white/10 bg-black/20 text-zinc-200 hover:border-white/20"
      }`}
    >
      <span>{children}</span>
      <span
        className={`ml-2 inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
          dirty ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
        }`}
      >
        {dirty ? "Изменено" : "Сохранено"}
      </span>
    </button>
  );
}

interface SectionCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function SectionCard({ title, description, actions, children }: SectionCardProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}
        </div>
        {actions}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function TextField({ label, value, onChange, placeholder, required }: FieldProps) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-semibold text-zinc-200">
        {label}
        {required ? <span className="ml-1 text-rose-400">*</span> : null}
      </div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-orange-500"
      />
    </label>
  );
}

export function TextAreaField({ label, value, onChange, placeholder, required }: FieldProps) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-semibold text-zinc-200">
        {label}
        {required ? <span className="ml-1 text-rose-400">*</span> : null}
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-orange-500"
      />
    </label>
  );
}

interface ButtonProps {
  onClick: () => void;
  children: ReactNode;
  tone?: "default" | "danger" | "success";
  disabled?: boolean;
}

export function SmallButton({ onClick, children, tone = "default", disabled }: ButtonProps) {
  const toneClass =
    tone === "danger"
      ? "bg-rose-600 hover:bg-rose-500"
      : tone === "success"
        ? "bg-emerald-600 hover:bg-emerald-500"
        : "bg-zinc-700 hover:bg-zinc-600";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-60 ${toneClass}`}
    >
      {children}
    </button>
  );
}
