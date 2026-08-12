import type { ObjectId } from "mongodb";

// Agent-only extended profile data — kept separate from the users collection
// since it's optional, only exists for agents, and can grow later (KYC docs,
// ratings, agency affiliation) without bloating the core auth document. One
// doc per agent, created lazily on first save (not at signup).

export type AgentProfileDoc = {
  _id?: ObjectId;
  userId: ObjectId; // -> users._id, unique
  dob: Date | null;
  pincode: string | null;
  preferredLanguage: string | null;
  profilePhotoUrl: string | null; // Vercel Blob URL
  createdAt: Date;
  updatedAt: Date;
};

export type AgentProfileView = {
  dob: string | null; // ISO date (YYYY-MM-DD)
  pincode: string | null;
  preferredLanguage: string | null;
  profilePhotoUrl: string | null;
  updatedAt: string;
};
