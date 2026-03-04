'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Brain, Calculator, Loader2, RefreshCw, Save, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/admin/common/AdminHeader';
import type { CalculatorConfig, UploadedDocument } from '@/types/calculator';

interface AdminCalculatorResponse {
  config: CalculatorConfig;
  uploads: UploadedDocument[];
  platforms: string[];
}

export default function AdminCalculatorPage() {
  const router = useRouter();
  const [adminLogin, setAdminLogin] = useState('admin');
  const [payload, setPayload] = useState<AdminCalculatorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<'rates' | 'ports' | null>(null);
  const [parsingId, setParsingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const sessionRes = await fetch('/api/admin/auth/me', { cache: 'no-store' });
      if (!sessionRes.ok) {
        router.replace('/admin/login?next=/admin/calculator');
        return;
      }
      const sessionData = await sessionRes.json();
      if (sessionData?.user?.login) {
        setAdminLogin(sessionData.user.login);
      }
      await fetchSettings();
    })();
  }, [router]);

  const uploads = useMemo(() => payload?.uploads || [], [payload]);
  const platforms = useMemo(() => payload?.platforms || [], [payload]);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/calculator', { cache: 'no-store' });
      const data = await res.json();
      if (res.status === 401) {
        router.replace('/admin/login?next=/admin/calculator');
        return;
      }
      if (!res.ok) throw new Error(data?.error || 'Ошибка загрузки');
      setPayload(data);
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const setConfigValue = (section: keyof CalculatorConfig, key: string, value: string) => {
    setPayload((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        config: {
          ...prev.config,
          [section]: {
            ...(prev.config[section] as any),
            [key]: key === 'ai_model' ? value : Number(value),
          },
        },
      };
    });
  };

  const saveSettings = async () => {
    if (!payload) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: payload.config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Ошибка сохранения');
      setMessage('Настройки калькулятора сохранены.');
      await fetchSettings();
    } catch (e: any) {
      setError(e?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const uploadDocument = async (kind: 'rates' | 'ports', file: File | null) => {
    if (!file) return;

    setUploadingKind(kind);
    setMessage(null);
    setError(null);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('kind', kind);

      const res = await fetch('/api/admin/calculator/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Ошибка загрузки файла');

      setMessage(`Файл «${data.originalName}» загружен.`);
      await fetchSettings();
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки файла');
    } finally {
      setUploadingKind(null);
    }
  };

  const parseDocument = async (fileId: number) => {
    setParsingId(fileId);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/admin/calculator/parse/${fileId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Ошибка AI-разбора');

      setMessage(data?.summary || 'Файл успешно разобран.');
      await fetchSettings();
    } catch (e: any) {
      setError(e?.message || 'Ошибка AI-разбора');
    } finally {
      setParsingId(null);
    }
  };

  if (loading || !payload) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <AdminHeader login={adminLogin} />
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      </div>
    );
  }

  const { config } = payload;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <AdminHeader login={adminLogin} />
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calculator className="text-orange-400" />
              Настройки калькулятора
            </h1>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold hover:bg-green-500 transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            Полностью локальная настройка расчета: маржи, наши услуги, СВХ, fallback-ставки и AI-разбор XLS/TXT.
          </p>
          {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
          {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Файлы ставок и портов" icon={<Upload size={18} className="text-orange-400" />}>
            <div className="space-y-3">
              <UploadInput
                label="Загрузить файл ставок (rates)"
                busy={uploadingKind === 'rates'}
                onSelect={(file) => uploadDocument('rates', file)}
              />
              <UploadInput
                label="Загрузить файл портов (ports)"
                busy={uploadingKind === 'ports'}
                onSelect={(file) => uploadDocument('ports', file)}
              />
            </div>

            <div className="mt-4 space-y-2">
              {uploads.length === 0 ? (
                <p className="text-sm text-zinc-500">Файлы пока не загружены.</p>
              ) : (
                uploads.slice(0, 8).map((item) => (
                  <div key={item.id} className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-medium text-zinc-100">{item.originalName}</div>
                        <div className="text-xs text-zinc-500">{item.kind} · {item.status}</div>
                      </div>
                      <button
                        onClick={() => parseDocument(item.id)}
                        disabled={parsingId === item.id}
                        className="inline-flex items-center gap-1 rounded-md bg-orange-600 px-3 py-1.5 text-xs font-semibold hover:bg-orange-500 transition-colors disabled:opacity-60"
                      >
                        {parsingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <Brain size={12} />}
                        {parsingId === item.id ? 'Разбор...' : 'Разобрать ИИ'}
                      </button>
                    </div>
                    {item.error ? <p className="mt-2 text-xs text-rose-400">{item.error}</p> : null}
                  </div>
                ))
              )}
            </div>
          </Section>

          <Section title="Маржи и расходы" icon={<RefreshCw size={18} className="text-orange-400" />}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Маржа до Минска (BYN)"
                value={config.margins.minsk_byn}
                onChange={(v) => setConfigValue('margins', 'minsk_byn', v)}
              />
              <Input
                label="Маржа до Клайпеды (BYN)"
                value={config.margins.klaipeda_byn}
                onChange={(v) => setConfigValue('margins', 'klaipeda_byn', v)}
              />
              <Input
                label="Маржа до Грузии (BYN)"
                value={config.margins.georgia_byn}
                onChange={(v) => setConfigValue('margins', 'georgia_byn', v)}
              />
              <Input
                label="Стоимость наших услуг (BYN)"
                value={config.costs.our_services_byn}
                onChange={(v) => setConfigValue('costs', 'our_services_byn', v)}
              />
              <Input
                label="Расходы на СВХ (BYN)"
                value={config.costs.svh_byn}
                onChange={(v) => setConfigValue('costs', 'svh_byn', v)}
              />
              <Input
                label="USD/BYN"
                value={config.rates.usd_byn}
                onChange={(v) => setConfigValue('rates', 'usd_byn', v)}
              />
            </div>
          </Section>

          <Section title="Fallback ставки" icon={<Calculator size={18} className="text-orange-400" />}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Аукционный сбор (USD)"
                value={config.fallback.auction_fee_usd}
                onChange={(v) => setConfigValue('fallback', 'auction_fee_usd', v)}
              />
              <Input
                label="До порта США (USD)"
                value={config.fallback.delivery_to_usa_port_usd}
                onChange={(v) => setConfigValue('fallback', 'delivery_to_usa_port_usd', v)}
              />
              <Input
                label="Море до Клайпеды (USD)"
                value={config.fallback.ocean_to_klaipeda_usd}
                onChange={(v) => setConfigValue('fallback', 'ocean_to_klaipeda_usd', v)}
              />
              <Input
                label="Море до Поти (USD)"
                value={config.fallback.ocean_to_poti_usd}
                onChange={(v) => setConfigValue('fallback', 'ocean_to_poti_usd', v)}
              />
              <Input
                label="Клайпеда -> пункт (USD)"
                value={config.fallback.klaipeda_to_minsk_usd}
                onChange={(v) => setConfigValue('fallback', 'klaipeda_to_minsk_usd', v)}
              />
              <Input
                label="Поти -> пункт (USD)"
                value={config.fallback.poti_to_georgia_usd}
                onChange={(v) => setConfigValue('fallback', 'poti_to_georgia_usd', v)}
              />
              <Input
                label="Таможенный сбор (BYN)"
                value={config.fallback.customs_fee_byn}
                onChange={(v) => setConfigValue('fallback', 'customs_fee_byn', v)}
              />
              <Input
                label="Утильсбор 0-3 (BYN)"
                value={config.fallback.recycling_0_3_byn}
                onChange={(v) => setConfigValue('fallback', 'recycling_0_3_byn', v)}
              />
              <Input
                label="Утильсбор 3-5 (BYN)"
                value={config.fallback.recycling_3_5_byn}
                onChange={(v) => setConfigValue('fallback', 'recycling_3_5_byn', v)}
              />
              <Input
                label="Утильсбор 5-7 (BYN)"
                value={config.fallback.recycling_5_7_byn}
                onChange={(v) => setConfigValue('fallback', 'recycling_5_7_byn', v)}
              />
              <Input
                label="Утильсбор 7+ (BYN)"
                value={config.fallback.recycling_7_plus_byn}
                onChange={(v) => setConfigValue('fallback', 'recycling_7_plus_byn', v)}
              />
            </div>
          </Section>

          <Section title="Справочники из БД" icon={<Brain size={18} className="text-orange-400" />}>
            <Input
              label="OpenAI модель"
              value={config.policies.ai_model}
              onChange={(v) => setConfigValue('policies', 'ai_model', v)}
            />
            <div className="mt-4">
              <p className="text-sm text-zinc-400 mb-2">Площадки из разобранных файлов:</p>
              <div className="flex flex-wrap gap-2">
                {platforms.length > 0 ? (
                  platforms.map((platform) => (
                    <span key={platform} className="rounded-md border border-white/15 bg-black/30 px-2 py-1 text-xs text-zinc-300">
                      {platform}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-zinc-500">Пока нет площадок в БД.</span>
                )}
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
      <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">{icon}{title}</h2>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | string;
  onChange: (value: string) => void;
}) {
  const isString = typeof value === 'string';

  return (
    <div>
      <label className="mb-1 block text-sm text-zinc-400">{label}</label>
      <input
        type={isString ? 'text' : 'number'}
        step={isString ? undefined : '0.01'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-orange-500"
      />
    </div>
  );
}

function UploadInput({
  label,
  busy,
  onSelect,
}: {
  label: string;
  busy: boolean;
  onSelect: (file: File | null) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 hover:border-orange-500 transition-colors">
      <Upload size={14} />
      {busy ? 'Загрузка...' : label}
      <input
        type="file"
        className="hidden"
        accept=".xlsx,.xls,.csv,.txt"
        onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
        disabled={busy}
      />
    </label>
  );
}
