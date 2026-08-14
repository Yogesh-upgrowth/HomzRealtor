// Bootstrap / break-glass tool for creating and promoting "super_admin"
// accounts.
//
// This is the ONLY way a super_admin account is ever created — there is no
// UI or API route for it, by design (see the admin-system plan). Both
// super admins are created directly here with --create, never through the
// public customer/agent signup form; after that, they use the in-app
// "Manage Admins" screen to grant/revoke the plain "admin" role to others.
//
// Usage:
//   Promote an existing user:
//     node scripts/set-user-role.mjs <email> <role>
//     node scripts/set-user-role.mjs jane@example.com super_admin
//
//   Create a brand-new account directly (bypasses signup entirely):
//     node scripts/set-user-role.mjs <email> <role> --create --name "Full Name" --phone 9876543210 --password "secret123" [--city "Gurgaon"]
//     node scripts/set-user-role.mjs jane@example.com super_admin --create --name "Jane Doe" --phone 9876543210 --password "correct-horse-battery"
//
// <role> is one of: customer, agent, admin, super_admin

import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const VALID_ROLES = ["customer", "agent", "admin", "super_admin"];
const SALT_ROUNDS = 10; // matches lib/auth/password.ts, so these hashes verify the same way at login
const PHONE_RE = /^[6-9]\d{9}$/;
const DEFAULT_CITY = "Gurgaon";

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

function parseArgs(argv) {
  const [email, role, ...rest] = argv;
  const flags = { create: false, name: null, phone: null, password: null, city: null };
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--create") flags.create = true;
    else if (arg === "--name") flags.name = rest[++i];
    else if (arg === "--phone") flags.phone = rest[++i];
    else if (arg === "--password") flags.password = rest[++i];
    else if (arg === "--city") flags.city = rest[++i];
  }
  return { email, role, flags };
}

function printUsage() {
  console.error("Usage:");
  console.error("  node scripts/set-user-role.mjs <email> <role>");
  console.error(
    '  node scripts/set-user-role.mjs <email> <role> --create --name "Full Name" --phone 9876543210 --password "secret123" [--city "City"]'
  );
  console.error(`<role> must be one of: ${VALID_ROLES.join(", ")}`);
}

async function main() {
  const { email, role, flags } = parseArgs(process.argv.slice(2));

  if (!email || !role) {
    printUsage();
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
    const existing = await users.findOne({ email: normalizedEmail });

    if (flags.create) {
      if (existing) {
        console.error(
          `A user with email "${normalizedEmail}" already exists — drop --create and run just the plain promote form instead.`
        );
        process.exit(1);
      }
      if (!flags.name || flags.name.trim().length < 2) {
        console.error("--create requires --name (at least 2 characters).");
        process.exit(1);
      }
      if (!flags.phone || !PHONE_RE.test(flags.phone.trim())) {
        console.error("--create requires --phone as a valid 10-digit mobile number starting 6-9.");
        process.exit(1);
      }
      if (!flags.password || flags.password.length < 8) {
        console.error("--create requires --password (at least 8 characters).");
        process.exit(1);
      }

      const phone = flags.phone.trim();
      const phoneTaken = await users.findOne({ phone });
      if (phoneTaken) {
        console.error(`Phone number "${phone}" is already in use by ${phoneTaken.email}.`);
        process.exit(1);
      }

      const passwordHash = await bcrypt.hash(flags.password, SALT_ROUNDS);
      const now = new Date();
      const doc = {
        name: flags.name.trim(),
        email: normalizedEmail,
        phone,
        city: (flags.city || DEFAULT_CITY).trim(),
        passwordHash,
        role,
        grantedAdminBy: null,
        grantedAdminAt: null,
        adminRequestedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      const { insertedId } = await users.insertOne(doc);
      console.log(`Created ${doc.email} (id ${insertedId.toString()}) directly with role "${role}".`);
      console.log("They can log in with the password you provided via the site's normal login form.");
      return;
    }

    if (!existing) {
      console.error(
        `No user found with email "${normalizedEmail}". Pass --create --name ... --phone ... --password ... to create the account directly (never via the public signup form).`
      );
      process.exit(1);
    }

    console.log(`Found user: ${existing.name} <${existing.email}> — current role: ${existing.role}`);

    if (existing.role === role) {
      console.log(`Already has role "${role}". No change made.`);
      return;
    }

    // Bootstrap via script is deliberately not "granted by" anyone — it's
    // the root of trust, not a delegation. grantedAdminBy/At stay null here
    // even when the role is "admin"; the in-app grant flow is what fills
    // those in for accountability on admins created that way.
    await users.updateOne(
      { _id: existing._id },
      {
        $set: {
          role,
          grantedAdminBy: null,
          grantedAdminAt: null,
          adminRequestedAt: null,
          updatedAt: new Date(),
        },
      }
    );

    console.log(`Updated ${existing.email}: ${existing.role} -> ${role}`);
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
