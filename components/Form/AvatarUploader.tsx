"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { Loader2, Camera, X } from "lucide-react";

// Single circular photo upload for the agent profile — posts to its own
// broker at /api/agent-profile/upload (image-only, small size cap), separate
// from /api/properties/upload which is scoped to property listing media.
// Not the multi-image ImageUploader, which is built for a property gallery
// with tags/cover selection this doesn't need.

type AvatarUploaderProps = {
  value: string | null;
  onChange: (url: string | null) => void;
  pathnamePrefix: string; // e.g. `profile-photos/<userId>`
};

export default function AvatarUploader({ value, onChange, pathnamePrefix }: AvatarUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setPreviewUrl(URL.createObjectURL(file));
    setIsUploading(true);
    try {
      const blob = await upload(`${pathnamePrefix}/${crypto.randomUUID()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/agent-profile/upload",
      });
      onChange(blob.url);
    } catch (error) {
      setPreviewUrl(null);
      toast.error(
        error instanceof Error ? `Photo upload failed: ${error.message}` : "Photo upload failed"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const displayUrl = previewUrl ?? value;

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#1a1a1d]">
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayUrl} alt="Profile photo" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-500">
            <Camera size={22} />
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 size={18} className="animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="rounded-full border border-white/10 px-4 py-2 text-[12.5px] font-semibold text-gray-300 hover:border-[#D9B268]/40 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {value ? "Change Photo" : "Upload Photo"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => {
              setPreviewUrl(null);
              onChange(null);
            }}
            className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-red-400 cursor-pointer"
          >
            <X size={12} />
            Remove
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
    </div>
  );
}
