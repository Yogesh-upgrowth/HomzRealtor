// Bootstrap / break-glass tool for granting the "super_admin" role.
//
// This is the ONLY way a super_admin account is ever created — there is no
// UI or API route for it, by design (see the admin-system plan). The two
// super admins are created once by running this script against an existing
// customer/agent account; after that, they use the in-app "Manage Admins"
// screen to grant/revoke the plain "admin" role to other users.
//
// Usage:
//   node scripts/set-user-role.mjs <email> <role>
//   node scripts/set-user-role.mjs jane@example.com super_admin
//
// <role> is one of: customer, agent, admin, super_admin
// The target user must already exist (sign up first) — this only changes
// their role in place.

import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";

const VALID_ROLES = ["customer", "agent", "admin", "super_admin"];

function loadEnvLocal() {
  if (process.env.MONGODB_URI) return;
  let raw;
  try {
    raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    return;
  }
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  const [email, role] = process.argv.slice(2);

  if (!email || !role) {
    console.error("Usage: node scripts/set-user-role.mjs <email> <role>");
    console.error(`<role> must be one of: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }
  if (!VALID_ROLES.includes(role)) {
    console.error(`Invalid role "${role}". Must be one of: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }

  loadEnvLocal();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set (checked process.env and .env.local).");
    process.exit(1);
  }
  const dbName = process.env.MONGODB_DB || "homz";

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const users = client.db(dbName).collection("users");

    const normalizedEmail = email.trim().toLowerCase();
    const user = await users.findOne({ email: normalizedEmail });
    if (!user) {
      console.error(`No user found with email "${normalizedEmail}". They must sign up first.`);
      process.exit(1);
    }

    console.log(`Found user: ${user.name} <${user.email}> — current role: ${user.role}`);

    if (user.role === role) {
      console.log(`Already has role "${role}". No change made.`);
      return;
    }

    // Bootstrap via script is deliberately not "granted by" anyone — it's
    // the root of trust, not a delegation. grantedAdminBy/At stay null here
    // even when the role is "admin"; the in-app grant flow is what fills
    // those in for accountability on admins created that way.
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          role,
          grantedAdminBy: null,
          grantedAdminAt: null,
          updatedAt: new Date(),
        },
      }
    );

    console.log(`Updated ${user.email}: ${user.role} -> ${role}`);
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
