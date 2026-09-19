#!/usr/bin/env node
// Prints what HomzRealtor still has to supply, grouped by the audit score it
// unblocks, and cross-checks the checklist against the values actually present
// in the codebase so the list cannot quietly go stale.
//
// Usage: npm run check:owner-inputs
//
// Read-only. Parses the two source files as text rather than importing them,
// so it runs without a build step and without pulling in Next's module graph.

import { readFileSync } from "node:fs";

const read = (p) => {
  try {
    return readFileSync(p, "utf8");
  } catch {
    return "";
  }
};

const inputsSrc = read("lib/content/ownerInputs.ts");
const companySrc = read("lib/seo/companyInfo.ts");
const pendingSrc = read("lib/content/ownerPending.ts");
const verificationSrc = read("lib/status/verification.ts");

// --- parse the checklist -----------------------------------------------------

const items = [];
for (const block of inputsSrc.split(/\n  \{\n/).slice(1)) {
  // Values are written as double- or single-quoted TS strings depending on
  // whether the text itself contains quotes, so match both.
  const get = (field) => {
    const dq = block.match(new RegExp(`${field}:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
    if (dq) return dq[1].replace(/\\"/g, '"');
    const sq = block.match(new RegExp(`${field}:\\s*'((?:[^'\\\\]|\\\\.)*)'`));
    return sq ? sq[1].replace(/\\'/g, "'") : null;
  };
  const key = get("key");
  if (!key) continue;
  items.push({
    key,
    area: get("area"),
    need: get("need"),
    lands: get("lands"),
    why: get("why"),
    offRepo: /offRepo:\s*true/.test(block),
  });
}

// --- detect which values are actually filled in ------------------------------

/** A COMPANY_INFO string field counts as filled when it is not "" */
function companyFilled(field) {
  const m = companySrc.match(new RegExp(`\\b${field}:\\s*"([^"]*)"`));
  return Boolean(m && m[1].trim());
}
function companySocialFilled(field) {
  const social = companySrc.split(/social:\s*\{/)[1] || "";
  const m = social.match(new RegExp(`\\b${field}:\\s*"([^"]*)"`));
  return Boolean(m && m[1].trim());
}

const detectors = {
  "identity.legalName": () => companyFilled("legalName"),
  "identity.hareraAgentNumber": () => companyFilled("hararaAgentNumber"),
  "identity.gst": () => companyFilled("gstNumber"),
  "identity.officeAddress": () => companyFilled("officeAddress"),
  "identity.hours": () =>
    companyFilled("hours") && !/openingHours:\s*null/.test(companySrc),
  "identity.googleBusinessUrl": () => companySocialFilled("googleBusiness"),
  "identity.socials": () =>
    ["instagram", "facebook", "linkedin", "youtube", "justdial"].some(companySocialFilled),
  "identity.team": () => !/team:\s*\[\]/.test(companySrc),
  // Wired when the source is anything but "none" AND a reader is implemented.
  "content.ownerCallLog": () =>
    !/OWNER_CALL_LOG_SOURCE[^=]*=\s*"none"/.test(verificationSrc) &&
    /latestVerification/.test(verificationSrc),
  "journeys.sellerLandlordTerms": () => !/value:\s*null/.test(pendingSrc),
};

for (const item of items) {
  const d = detectors[item.key];
  item.done = d ? d() : false;
  item.detectable = Boolean(d);
}

// --- report ------------------------------------------------------------------

const AREAS = [
  "Technical",
  "Architecture",
  "Content originality",
  "Trust and local",
  "Authority",
];

const BAR = 28;
console.log("\nHomzRealtor — owner inputs still outstanding\n");

let totalDone = 0;
for (const area of AREAS) {
  const inArea = items.filter((i) => i.area === area);
  if (inArea.length === 0) continue;
  const done = inArea.filter((i) => i.done).length;
  totalDone += done;
  const filled = Math.round((done / inArea.length) * BAR);
  const bar = "█".repeat(filled) + "░".repeat(BAR - filled);
  console.log(`${area}`);
  console.log(`  ${bar}  ${done}/${inArea.length} supplied\n`);
  for (const i of inArea) {
    if (i.done) {
      console.log(`  [x] ${i.key}`);
      continue;
    }
    console.log(`  [ ] ${i.key}${i.offRepo ? "  (outside this repo)" : ""}`);
    console.log(`      need:  ${i.need}`);
    console.log(`      lands: ${i.lands}`);
    if (!i.detectable) {
      console.log(`      note:  cannot be auto-detected — confirm by hand`);
    }
    console.log("");
  }
}

console.log(
  `${totalDone}/${items.length} supplied. Items marked "outside this repo" are ` +
    `actions on Google, GitHub, Vercel or the directories, not code changes.\n`
);
