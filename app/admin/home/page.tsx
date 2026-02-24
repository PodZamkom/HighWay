'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, Upload } from 'lucide-react';

export default function AdminHomePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [jsonDraft, setJsonDraft] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [uploadPath, setUploadPath] = useState('');

    useEffect(() => {
        loadContent();
    }, []);

    const isJsonValid = useMemo(() => {
        if (!jsonDraft.trim()) return false;
        try {
            JSON.parse(jsonDraft);
            return true;
        } catch {
            return false;
        }
    }, [jsonDraft]);

    const loadContent = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/site-content');
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error || 'Не удалось загрузить контент');
            }

            setJsonDraft(JSON.stringify(data, null, 2));
        } catch (e: any) {
            setError(e?.message || 'Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    };

    const saveContent = async () => {
        try {
            setSaving(true);
            setError(null);

            const parsed = JSON.parse(jsonDraft);
            const res = await fetch('/api/admin/site-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error || 'Не удалось сохранить контент');
            }

            alert('Контент сохранен');
        } catch (e: any) {
            setError(e?.message || 'Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    };

    const uploadImage = async (file: File | null) => {
        if (!file) return;
        setUploading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error || 'Ошибка загрузки');
            }

            setUploadPath(data.path || '');
        } catch (e: any) {
            setError(e?.message || 'Ошибка загрузки');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
                    <h1 className="text-2xl font-bold">Редактор главной страницы</h1>
                    <p className="mt-2 text-sm text-zinc-400">
                        Здесь редактируется весь контент `data/site.json`, включая Hero, 3 баннера, «Глобальный рынок», калькулятор и блок команды.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm">
                        <a href="/admin/calculator" className="rounded-lg bg-zinc-800 px-3 py-2 hover:bg-zinc-700 transition-colors">
                            Перейти к настройкам калькулятора курсов
                        </a>
                        <a href="/" className="rounded-lg bg-zinc-800 px-3 py-2 hover:bg-zinc-700 transition-colors">
                            Открыть сайт
                        </a>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
                    <h2 className="text-xl font-semibold">Загрузка изображения</h2>
                    <p className="mt-2 text-sm text-zinc-400">
                        Загрузите файл и вставьте полученный путь в нужное поле JSON (например, `promoBanners.banners[].image`).
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold hover:bg-orange-500 transition-colors">
                            <Upload size={16} />
                            {uploading ? 'Загрузка...' : 'Выбрать файл'}
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => uploadImage(e.target.files?.[0] ?? null)}
                                disabled={uploading}
                            />
                        </label>
                        {uploadPath ? (
                            <code className="rounded-md bg-black/40 px-3 py-2 text-xs text-emerald-300 break-all">
                                {uploadPath}
                            </code>
                        ) : null}
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-xl font-semibold">JSON контент сайта</h2>
                        <button
                            onClick={saveContent}
                            disabled={saving || !isJsonValid}
                            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold hover:bg-green-500 transition-colors disabled:opacity-60"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>

                    <textarea
                        value={jsonDraft}
                        onChange={(e) => setJsonDraft(e.target.value)}
                        className="h-[70vh] w-full rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-sm text-zinc-100 outline-none focus:border-orange-500"
                        spellCheck={false}
                    />
                    {!isJsonValid ? (
                        <p className="mt-2 text-sm text-rose-400">JSON содержит ошибку синтаксиса.</p>
                    ) : null}
                    {error ? <p className="mt-2 text-sm text-rose-400">{error}</p> : null}
                </div>
            </div>
        </div>
    );
}
