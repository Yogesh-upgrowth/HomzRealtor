import { ObjectId } from "mongodb";
import { getAgentProfilesCollection } from "./db";
import type { AgentProfileDoc } from "./types";
import type { UpdateAgentProfileInput } from "./validation";

export async function getAgentProfile(userId: string): Promise<AgentProfileDoc | null> {
  const profiles = await getAgentProfilesCollection();
  return profiles.findOne({ userId: new ObjectId(userId) });
}

export async function upsertAgentProfile(
  userId: string,
  input: UpdateAgentProfileInput
): Promise<AgentProfileDoc> {
  const profiles = await getAgentProfilesCollection();
  const now = new Date();
  const result = await profiles.findOneAndUpdate(
    { userId: new ObjectId(userId) },
    {
      $set: {
        dob: input.dob ? new Date(input.dob) : null,
        pincode: input.pincode,
        preferredLanguage: input.preferredLanguage,
        profilePhotoUrl: input.profilePhotoUrl,
        updatedAt: now,
      },
      $setOnInsert: {
        userId: new ObjectId(userId),
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: "after" }
  );
  if (!result) {
    throw new Error("Failed to save agent profile");
  }
  return result;
}
