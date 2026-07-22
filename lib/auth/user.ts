import { Collection, ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export type UserRole = "customer" | "agent";

export type UserDocument = {
  // Optional in the type so the MongoDB driver lets us omit it on insert and
  // auto-generate it — always present in practice on documents read back out.
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
};

// Safe to send to the client — never includes passwordHash.
export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export function toPublicUser(doc: UserDocument): PublicUser {
  if (!doc._id) {
    throw new Error("toPublicUser requires a document with an _id");
  }
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
  };
}

let indexesEnsured = false;

export async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const db = await getDb();
  const collection = db.collection<UserDocument>("users");

  if (!indexesEnsured) {
    indexesEnsured = true;
    // Email is unique across both roles — a customer and an agent can't share one.
    await collection.createIndex({ email: 1 }, { unique: true }).catch(() => {});
  }

  return collection;
}
