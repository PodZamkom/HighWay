"use client";

import { useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";

interface MediaFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
}

async function uploadFileWithProgress(url: string, file: File, onProgress: (percent: number) => void): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(percent);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
}

export function MediaField({ label, value, onChange, accept = "image/*" }: MediaFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File | null) => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const presignResponse = await fetch("/api/admin/media/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mime: file.type,
          size: file.size,
        }),
      });
      const presignPayload = await presignResponse.json();
      if (!presignResponse.ok) {
        throw new Error(presignPayload?.error || "Не удалось подготовить загрузку");
      }

      await uploadFileWithProgress(presignPayload.uploadUrl, file, setProgress);

      const completeResponse = await fetch("/api/admin/media/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: presignPayload.key,
          mime: file.type,
          size: file.size,
          originalName: file.name,
          width: null,
          height: null,
        }),
      });
      const completePayload = await completeResponse.json();
      if (!completeResponse.ok) {
        throw new Error(completePayload?.error || "Не удалось сохранить файл");
      }

      onChange(completePayload.asset?.url || presignPayload.publicUrl || value);
      setProgress(100);
    } catch (cause: any) {
      setError(cause?.message || "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-300">{label}</div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700">
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
          {uploading ? "Загрузка..." : "Выбрать файл"}
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              void upload(event.target.files?.[0] ?? null);
              event.currentTarget.value = "";
            }}
          />
        </label>

        <input
          type="text"
          value={value}
          readOnly
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-orange-500"
          placeholder="Файл не выбран"
        />
      </div>

      {uploading ? (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-zinc-800">
          <div className="h-full bg-orange-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}
