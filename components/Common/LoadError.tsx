"use client";

// Shared error state for client-fetched sections: friendly message + retry.

type Props = {
  message?: string;
  onRetry: () => void;
};

export default function LoadError({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[18px] border border-white/[0.08] bg-[#141416] px-6 py-14 text-center">
      <p className="text-gray-400">
        {message || "Something went wrong while loading projects."}
      </p>
      <button
        onClick={onRetry}
        className="rounded-full border border-[#D9B268]/40 px-5 py-2 text-[13px] font-bold text-[#D9B268] hover:bg-[#D9B268]/10 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
