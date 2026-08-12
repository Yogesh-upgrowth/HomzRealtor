"use client";

import { X } from "lucide-react";
import AgentProfileForm, {
  type AgentCoreValues,
  type AgentExtendedValues,
} from "./AgentProfileForm";

type AgentProfileEditModalProps = {
  userId: string;
  email: string;
  initialCore: AgentCoreValues;
  initialProfile: AgentExtendedValues;
  onSaved: (core: AgentCoreValues, profile: AgentExtendedValues) => void;
  onClose: () => void;
};

export default function AgentProfileEditModal({
  userId,
  email,
  initialCore,
  initialProfile,
  onSaved,
  onClose,
}: AgentProfileEditModalProps) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center px-4 py-8">
      <div className="relative w-full max-w-lg rounded-[24px] border border-white/10 bg-[#141416] text-white shadow-[0_30px_90px_rgba(0,0,0,0.6)] p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-gray-300 hover:border-[#D9B268] hover:text-[#D9B268] transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <h2 className="text-xl sm:text-2xl font-bold mb-4 bg-gradient-to-br from-[#F2D79B] to-[#C99A4B] bg-clip-text text-transparent">
          Edit Profile
        </h2>

        <AgentProfileForm
          userId={userId}
          email={email}
          initialCore={initialCore}
          initialProfile={initialProfile}
          onSaved={onSaved}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
