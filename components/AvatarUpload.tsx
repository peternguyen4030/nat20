"use client";

import { useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";

// ── Default avatar ────────────────────────────────────────────────────────────

export function DefaultAvatar({ size = 48, className = "" }: {
  size?: number; className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none"
      xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="48" height="48" rx="6" fill="#EDE6D6" />
      <circle cx="24" cy="18" r="8" fill="#C4B49A" />
      <path d="M8 44 C8 34 16 30 24 30 C32 30 40 34 40 44" fill="#C4B49A" />
    </svg>
  );
}

// ── Avatar display ────────────────────────────────────────────────────────────

export function Avatar({ src, alt, size = 48, className = "" }: {
  src?: string | null; alt?: string; size?: number; className?: string;
}) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return <DefaultAvatar size={size} className={className} />;
  }
  return (
    <img src={src} alt={alt ?? "Avatar"} width={size} height={size}
      onError={() => setError(true)}
      className={`object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

// ── Avatar upload — hover overlay only, no text label below ──────────────────

export function AvatarUpload({
  currentUrl,
  endpoint,
  onUploadComplete,
  size = 80,
}: {
  currentUrl?:       string | null;
  endpoint:          "characterAvatar" | "userAvatar";
  onUploadComplete:  (url: string) => void;
  size?:             number;
}) {
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const { startUpload } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      if (res?.[0]?.url) onUploadComplete(res[0].url);
      setUploading(false);
    },
    onUploadError: (err) => {
      setError(err.message);
      setUploading(false);
    },
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) return setError("Image must be under 4MB");
    if (!file.type.startsWith("image/")) return setError("Images only");
    setError(null);
    setUploading(true);
    await startUpload([file]);
  }

  return (
    <div className="flex flex-col items-center">
      {/* Avatar with hover overlay — only UI needed */}
      <div
        className="relative rounded-sketch border-2 border-sketch overflow-hidden shadow-sketch cursor-pointer"
        style={{ width: size, height: size }}
      >
        <Avatar src={currentUrl} size={size} />

        <label
          htmlFor="avatar-upload"
          className={`absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink/50 transition-opacity duration-150 cursor-pointer ${
            uploading ? "opacity-100" : "opacity-0 hover:opacity-100"
          }`}
        >
          {uploading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span className="text-white text-lg">📷</span>
              <span className="text-white text-[0.6rem] font-sans font-semibold text-center leading-tight px-2">
                Change photo
              </span>
            </>
          )}
        </label>

        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="sr-only"
        />
      </div>

      {/* Error only — no label */}
      {error && (
        <p className="font-sans text-xs text-blush mt-1.5">{error}</p>
      )}
    </div>
  );
}

// ── DM Asset uploader ─────────────────────────────────────────────────────────

export function DmAssetUpload({ onUploadComplete }: {
  onUploadComplete: (files: { name: string; url: string; type: string }[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const { startUpload } = useUploadThing("dmAsset", {
    onClientUploadComplete: (res) => {
      if (res) onUploadComplete(res.map((f) => ({ name: f.name, url: f.url, type: f.type ?? "image" })));
      setUploading(false);
    },
    onUploadError: (err) => { setError(err.message); setUploading(false); },
  });

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setError(null); setUploading(true);
    await startUpload(files);
  }

  return (
    <div className="space-y-2">
      <label htmlFor="dm-asset-upload"
        className={`flex flex-col items-center justify-center w-full h-28 bg-parchment border-2 border-dashed rounded-sketch transition-all cursor-pointer ${
          uploading ? "border-blush/50 bg-blush/5" : "border-sketch hover:border-blush/50 hover:bg-paper"
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <span className="w-5 h-5 border-2 border-blush border-t-transparent rounded-full animate-spin" />
            <p className="font-sans text-xs text-ink-faded">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-2xl">📁</span>
            <p className="font-sans text-sm font-semibold text-ink-soft">Drop files or click to upload</p>
            <p className="font-sans text-xs text-ink-faded">Images up to 16MB · PDFs up to 16MB · Up to 10 files</p>
          </div>
        )}
        <input id="dm-asset-upload" type="file" accept="image/*,.pdf" multiple onChange={handleFiles} disabled={uploading} className="sr-only" />
      </label>
      {error && <p className="font-sans text-xs text-blush">{error}</p>}
    </div>
  );
}
