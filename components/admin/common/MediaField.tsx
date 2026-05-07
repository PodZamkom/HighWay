"use client";

import { useCallback, useRef, useState } from "react";
import { ImageIcon, Loader2, Trash2, UploadCloud } from "lucide-react";

interface MediaFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onAsset?: (asset: { id: string; url: string; mime: string }) => void;
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

async function uploadLocal(file: File, onProgress: (percent: number) => void): Promise<{ id: string; url: string; mime: string }> {
  const form = new FormData();
  form.append("file", file);

  return await new Promise<{ id: string; url: string; mime: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media/upload-local");

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(percent);
    };

    xhr.onload = () => {
      try {
        const payload = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300 && payload.asset) {
          resolve(payload.asset);
        } else {
          reject(new Error(payload?.error || `Upload failed with status ${xhr.status}`));
        }
      } catch (cause) {
        reject(cause instanceof Error ? cause : new Error("Upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(form);
  });
}

export function MediaField({ label, value, onChange, onAsset, accept = "image/*" }: MediaFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isImage = !!value && /\.(jpe?g|png|webp|avif|gif|svg)(\?|$)/i.test(value);

  const upload = useCallback(async (file: File | null) => {
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

      if (presignResponse.status === 503) {
        const asset = await uploadLocal(file, setProgress);
        onAsset?.(asset);
        onChange(asset.url);
        setProgress(100);
        return;
      }

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

      const uploadedAsset = completePayload.asset as { id: string; url: string; mime: string } | undefined;
      if (uploadedAsset) {
        onAsset?.(uploadedAsset);
      }

      onChange(uploadedAsset?.url || presignPayload.publicUrl || value);
      setProgress(100);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Ошибка загрузки";
      setError(message);
    } finally {
      setUploading(false);
    }
  }, [onAsset, onChange, value]);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void upload(file);
    }
  };

  const clear = () => {
    if (uploading) return;
    onChange("");
    setProgress(0);
    setError(null);
  };

  return (
    <div
      className={`rounded-xl border p-3 transition ${
        dragActive ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-black/30"
      }`}
      onDragEnter={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(false);
      }}
      onDrop={handleDrop}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-300">{label}</span>
        {value ? (
          <button
            type="button"
            onClick={clear}
            disabled={uploading}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-300 transition hover:border-rose-500/40 hover:text-rose-200 disabled:opacity-50"
          >
            <Trash2 size={12} /> Удалить
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/40">
          {value ? (
            isImage ? (
              <img src={value} alt={label} className="h-full w-full object-cover" />
            ) : (
              <ImageIcon size={20} className="text-zinc-400" />
            )
          ) : (
            <ImageIcon size={20} className="text-zinc-500" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
            {uploading ? "Загрузка..." : value ? "Заменить файл" : "Выбрать файл"}
            <input
              ref={inputRef}
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
            className="min-w-0 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-orange-500"
            placeholder="Перетащите файл сюда или нажмите «Выбрать файл»"
          />
        </div>
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
