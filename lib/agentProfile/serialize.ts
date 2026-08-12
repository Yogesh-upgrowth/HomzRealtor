import type { AgentProfileDoc, AgentProfileView } from "./types";

export function toAgentProfileView(doc: AgentProfileDoc): AgentProfileView {
  return {
    dob: doc.dob ? doc.dob.toISOString().slice(0, 10) : null,
    pincode: doc.pincode,
    preferredLanguage: doc.preferredLanguage,
    profilePhotoUrl: doc.profilePhotoUrl,
    updatedAt: doc.updatedAt.toISOString(),
  };
}
