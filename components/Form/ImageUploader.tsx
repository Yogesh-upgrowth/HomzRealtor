"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { UploadCloud, X, Loader2, Star, RefreshCw } from "lucide-react";
import { selectClass } from "./FormField";
import type { ChipOption } from "./ChipGroup";

export type UploadedMedia = {
  id: string;
  url: string | null;
  file?: File;
  tag: string | null;
  isCover: boolean;
  status: "uploading" | "done" | "error";
  progress: number;
};

type ImageUploaderProps = {
  kind: "image" | "video";
  items: UploadedMedia[];
  onChange: (items: UploadedMedia[]) => void;
  clientTempId: string;
  maxItems?: number;
  minRequiredHint?: string;
  tagOptions?: ChipOption[];
};

const ACCEPT = { image: "image/jpeg,image/png,image/webp", video: "video/mp4,video/quicktime" };

export default function ImageUploader({
  kind,
  items,
  onChange,
  clientTempId,
  maxItems = kind === "image" ? 20 : 3,
  minRequiredHint,
  tagOptions,
}: ImageUploaderProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Concurrent uploads (several files dropped at once) each run their own
  // async chain — without this ref, a progress/completion update from one
  // file would compute its patch against the stale `items` snapshot from
  // whenever its upload started, silently dropping any sibling files added
  // in between.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Single source of truth for the cover invariant: whenever exactly one
  // image exists, or none of the current images are flagged, the first one
  // is the cover. This guarantees a lone image is always the card photo
  // without every call site (upload, remove, retry) having to re-derive it.
  const emit = (next: UploadedMedia[]) => {
    const normalized =
      kind === "image" && next.length > 0 && !next.some((i) => i.isCover)
        ? next.map((item, idx) => (idx === 0 ? { ...item, isCover: true } : item))
        : next;
    itemsRef.current = normalized;
    onChange(normalized);
  };

  const patchItem = (id: string, patch: (item: UploadedMedia) => UploadedMedia) => {
    emit(itemsRef.current.map((item) => (item.id === id ? patch(item) : item)));
  };

  const startUpload = async (file: File) => {
    const id = crypto.randomUUID();
    const localPreview: UploadedMedia = {
      id,
      url: kind === "image" ? URL.createObjectURL(file) : null,
      file,
      tag: null,
      isCover: false,
      status: "uploading",
      progress: 0,
    };
    emit([...itemsRef.current, localPreview]);

    try {
      const blob = await upload(`properties/${clientTempId}/${crypto.randomUUID()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/properties/upload",
        onUploadProgress: (event) => {
          patchItem(id, (item) => ({ ...item, progress: event.percentage }));
        },
      });
      patchItem(id, (item) => ({ ...item, url: blob.url, status: "done", progress: 100 }));
    } catch {
      patchItem(id, (item) => ({ ...item, status: "error" }));
    }
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList).slice(0, Math.max(0, maxItems - items.length));
    files.forEach((file) => startUpload(file));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeItem = (id: string) => {
    emit(items.filter((i) => i.id !== id));
  };

  const setCover = (id: string) => {
    emit(items.map((item) => ({ ...item, isCover: item.id === id })));
  };

  const setTag = (id: string, tag: string) => {
    emit(items.map((item) => (item.id === id ? { ...item, tag } : item)));
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-[#141416] px-6 py-8 text-center cursor-pointer transition-colors ${
          isDraggingOver ? "border-[#D9B268]/60" : "border-white/10 hover:border-[#D9B268]/40"
        }`}
      >
        <UploadCloud size={22} className="text-[#D9B268]" />
        <p className="text-sm font-semibold text-white">
          {kind === "image" ? "Upload Image" : "Upload Video"}
        </p>
        {minRequiredHint && <p className="text-[12.5px] text-gray-500">{minRequiredHint}</p>}
        <input
          ref={inputRef}
          type="file"
          multiple={kind === "image"}
          accept={ACCEPT[kind]}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {items.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-[#1a1a1d] p-2">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-black/40">
                {kind === "image" && item.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-500 text-xs">
                    {kind === "video" ? "Video" : "..."}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black cursor-pointer"
                  aria-label="Remove"
                >
                  <X size={13} />
                </button>
                {item.status === "uploading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs gap-1">
                    <Loader2 size={16} className="animate-spin" />
                    {item.progress}%
                  </div>
                )}
                {item.status === "error" && (
                  <button
                    type="button"
                    onClick={() => item.file && startUpload(item.file)}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/70 text-red-300 text-xs cursor-pointer"
                  >
                    <RefreshCw size={14} />
                    Retry
                  </button>
                )}
              </div>

              {kind === "image" && (
                <div className="mt-2 space-y-1.5">
                  {tagOptions && (
                    <select
                      value={item.tag ?? ""}
                      onChange={(e) => setTag(item.id, e.target.value)}
                      className={selectClass}
                    >
                      <option value="" disabled>
                        Choose Your Tag
                      </option>
                      {tagOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => setCover(item.id)}
                    className={`flex items-center gap-1.5 text-[12px] cursor-pointer ${
                      item.isCover ? "text-[#D9B268]" : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    <Star size={12} fill={item.isCover ? "currentColor" : "none"} />
                    {item.isCover ? "Cover photo" : "Set as cover"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
