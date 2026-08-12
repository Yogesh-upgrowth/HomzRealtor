import { Collection, ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

// Exactly two "super_admin" accounts exist, created only via
// scripts/set-user-role.mjs — never through signup or any API route. A
// super_admin can grant/revoke plain "admin" to any user; a plain "admin"
// cannot grant admin access to anyone else. See lib/auth/guards.ts.
export type UserRole = "customer" | "agent" | "admin" | "super_admin";

export type UserDocument = {
  // Optional in the type so the MongoDB driver lets us omit it on insert and
  // auto-generate it — always present in practice on documents read back out.
  _id?: ObjectId;
  name: string;
  email: string;
  phone: string;
  city: string;
  passwordHash: string;
  role: UserRole;
  // Accountability for the admin-granting flow: which super_admin granted
  // this account's admin role, and when. Null for customer/agent accounts
  // and for super_admins themselves (they're bootstrapped, not granted).
  grantedAdminBy: ObjectId | null;
  grantedAdminAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// Safe to send to the client — never includes passwordHash.
export type PublicUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
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
    phone: doc.phone,
    city: doc.city,
    role: doc.role,
  };
}

let indexesEnsured = false;

export async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const db = await getDb();
  const collection = db.collection<UserDocument>("users");

  if (!indexesEnsured) {
    indexesEnsured = true;
    // Email and phone are each unique across all roles — one account per
    // email, one account per phone number.
    await Promise.all([
      collection.createIndex({ email: 1 }, { unique: true }),
      collection.createIndex({ phone: 1 }, { unique: true }),
    ]).catch(() => {});
  }

  return collection;
}
