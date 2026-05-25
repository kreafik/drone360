"use client";

import { useCallback, useRef, useState } from "react";
import { CloudUpload, X, CheckCircle2, AlertCircle, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { cn } from "@/lib/utils";

const MAX_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/webp"];

interface FileUploadState {
  file: File;
  id: string;
  status: "pending" | "compressing" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
  compressedSize?: number;
}

interface UploadDropzoneProps {
  projectId: string;
  onAllDone: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadDropzone({ projectId, onAllDone }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<FileUploadState[]>([]);
  const [started, setStarted] = useState(false);

  function updateUpload(id: string, patch: Partial<Omit<FileUploadState, "id" | "file">>) {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  function addFiles(files: FileList | null) {
    if (!files || started) return;
    const valid: FileUploadState[] = [];
    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Sadece JPG veya WebP destekleniyor.`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name}: 50MB sınırını aşıyor (${formatSize(file.size)}).`);
        continue;
      }
      valid.push({ file, id: crypto.randomUUID(), status: "pending", progress: 0 });
    }
    if (valid.length > 0) setUploads((prev) => [...prev, ...valid]);
  }

  async function uploadSingle(state: FileUploadState): Promise<boolean> {
    // Step 1: Compress client-side (Web Worker — doesn't block UI)
    updateUpload(state.id, { status: "compressing", progress: 0 });

    let fileToUpload: File = state.file;
    try {
      const compressed = await imageCompression(state.file, {
        maxSizeMB: 15,
        initialQuality: 0.85,
        // Prevent any resizing — panoramas need full resolution.
        // browser-image-compression defaults to 1920 if omitted, which would destroy quality.
        maxWidthOrHeight: 16384,
        useWebWorker: true,
        fileType: "image/jpeg",
        onProgress: (p: number) => {
          updateUpload(state.id, { progress: Math.round(p * 0.28) });
        },
      });

      if (compressed.size < state.file.size) {
        // Rename extension to .jpg since we forced JPEG output
        const baseName = state.file.name.replace(/\.[^.]+$/, "");
        fileToUpload = new File([compressed], `${baseName}.jpg`, { type: "image/jpeg" });
        updateUpload(state.id, { compressedSize: fileToUpload.size });
      }
    } catch {
      // Compression failed — proceed with original file
    }

    // Step 2: Get presigned URL (use compressed file's type + size — R2 binds ContentLength)
    updateUpload(state.id, { status: "uploading", progress: 30 });

    const signRes = await fetch("/api/uploads/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        fileName: fileToUpload.name,
        fileType: fileToUpload.type,
        fileSize: fileToUpload.size,
      }),
    });

    if (!signRes.ok) {
      const { error } = await signRes.json();
      updateUpload(state.id, { status: "error", error: error?.message ?? "İmzalama hatası." });
      return false;
    }

    const { panoramaId, uploadUrl } = await signRes.json();
    updateUpload(state.id, { progress: 33 });

    // Step 3: XHR PUT to R2 for progress tracking
    const xhrOk = await new Promise<boolean>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = 33 + Math.round((e.loaded / e.total) * 57);
          updateUpload(state.id, { progress: pct });
        }
      };
      xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
      xhr.onerror = () => resolve(false);
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", fileToUpload.type);
      xhr.send(fileToUpload);
    });

    if (!xhrOk) {
      updateUpload(state.id, { status: "error", error: "R2 yükleme hatası. Bağlantınızı kontrol edin." });
      return false;
    }

    updateUpload(state.id, { progress: 92 });

    // Step 4: Complete (thumbnail generation)
    const completeRes = await fetch("/api/uploads/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ panoramaId }),
    });

    if (!completeRes.ok) {
      const { error } = await completeRes.json();
      updateUpload(state.id, { status: "error", error: error?.message ?? "İşleme hatası." });
      return false;
    }

    updateUpload(state.id, { status: "done", progress: 100 });
    return true;
  }

  async function startUploads() {
    if (uploads.length === 0 || started) return;
    setStarted(true);

    const pending = uploads.filter((u) => u.status === "pending");

    // Sequential — parallel requests race on the DB position counter
    let successCount = 0;
    for (const u of pending) {
      const ok = await uploadSingle(u);
      if (ok) successCount++;
    }

    if (successCount > 0) {
      toast.success(`${successCount} panorama yüklendi.`);
      onAllDone();
    } else {
      toast.error("Yükleme başarısız. Lütfen tekrar deneyin.");
    }
  }

  function removeFile(id: string) {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer.files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [started]
  );

  const allDone =
    uploads.length > 0 && uploads.every((u) => u.status === "done" || u.status === "error");
  const isUploading = uploads.some(
    (u) => u.status === "compressing" || u.status === "uploading"
  );

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      {!started && (
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer",
            dragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-border-strong hover:bg-surface-elevated"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <CloudUpload className="size-10 text-subtle mb-3" strokeWidth={1.5} />
          <p className="font-medium text-sm">Dosyaları buraya sürükleyin</p>
          <p className="text-xs text-muted-foreground mt-1">veya tıklayarak seçin</p>
          <p className="text-xs text-subtle mt-3">JPG · WebP · Maks 50 MB · Çoklu seçim desteklenir</p>
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.webp,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>
      )}

      {/* File list */}
      {uploads.length > 0 && (
        <ul className="space-y-2">
          {uploads.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 text-sm"
            >
              {/* Status icon */}
              <span className="shrink-0">
                {u.status === "done" && <CheckCircle2 className="size-4 text-success" />}
                {u.status === "error" && <AlertCircle className="size-4 text-danger" />}
                {u.status === "compressing" && <Zap className="size-4 text-amber-400 animate-pulse" />}
                {u.status === "uploading" && <Loader2 className="size-4 animate-spin text-primary" />}
                {u.status === "pending" && (
                  <span className="size-4 rounded-full border border-border inline-block" />
                )}
              </span>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{u.file.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {u.compressedSize != null ? (
                    <span className="text-xs text-muted-foreground">
                      {formatSize(u.file.size)}
                      <span className="mx-1 text-success">→</span>
                      <span className="text-success font-medium">{formatSize(u.compressedSize)}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{formatSize(u.file.size)}</span>
                  )}
                  {u.status === "compressing" && (
                    <span className="text-xs text-amber-400">Sıkıştırılıyor…</span>
                  )}
                  {u.status === "error" && u.error && (
                    <span className="text-xs text-danger">{u.error}</span>
                  )}
                </div>
                {(u.status === "compressing" || u.status === "uploading") && (
                  <div className="mt-1.5 h-1 rounded-full bg-surface-elevated overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${u.progress}%`,
                        background: u.status === "compressing"
                          ? "oklch(0.78 0.16 70)"
                          : "var(--color-primary)",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Remove (only when pending) */}
              {u.status === "pending" && !started && (
                <button
                  type="button"
                  onClick={() => removeFile(u.id)}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Actions */}
      {uploads.length > 0 && !allDone && (
        <div className="flex justify-end gap-2">
          {!started && (
            <button
              type="button"
              onClick={() => { setUploads([]); setStarted(false); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Temizle
            </button>
          )}
          <button
            type="button"
            onClick={startUploads}
            disabled={started || isUploading}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            )}
          >
            {isUploading && <Loader2 className="size-3.5 animate-spin" />}
            {isUploading ? "İşleniyor…" : "Yüklemeyi Başlat"}
          </button>
        </div>
      )}

      {allDone && (
        <p className="text-center text-sm text-muted-foreground">
          Yükleme tamamlandı.
        </p>
      )}
    </div>
  );
}
