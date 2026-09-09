#!/usr/bin/env node
// One-off migration for SEO audit H-03 (2026-09-08): blog hero images
// currently hotlink static.squareyards.com — a competitor's CDN. This
// downloads each one, re-uploads it to this project's own Vercel Blob store
// under a clean SEO filename, then rewrites the blog post's own
// hero.imageUrl / social.ogImage field to the new URL. BlogPosting.image in
// lib/seo/blogJsonLd.ts reads hero.imageUrl directly, so fixing it there
// fixes the schema automatically — no separate schema edit needed.
//
// Real action on live infrastructure: writes to this project's actual
// Vercel Blob store (BLOB_READ_WRITE_TOKEN from .env.local) and rewrites
// source files in lib/content/blog/. Review the dry-run output before
// running for real.
//
// Usage:
//   node scripts/migrate-blog-hero-images.mjs --dry-run   (prints the plan, uploads nothing, edits nothing)
//   node scripts/migrate-blog-hero-images.mjs             (does it for real)

import fs from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";

const BLOG_DIR = path.join(process.cwd(), "lib", "content", "blog");
const DRY_RUN = process.argv.includes("--dry-run");

// Matches the one hardcoded hotlinked hero URL per post (used for both
// hero.imageUrl and social.ogImage — same URL, two fields).
const URL_RE = /https:\/\/(?:static|img)\.squareyards\.com\/[^\s"']+\.(?:jpg|jpeg|png|webp)/i;

function deriveSlug(originalUrl) {
  const base = originalUrl.split("/").pop().replace(/\.\w+$/, "");
  // Deliberately keeps the trailing numeric asset id (e.g. "...-4182") rather
  // than stripping it — two different source images can otherwise reduce to
  // the identical cleaned name (confirmed live: two 2026-09-08 posts' hero
  // images both collapsed to "delphine-central-park-estates-tower-view1-
  // gurgaon.jpg"), which would silently overwrite one at upload time since
  // addRandomSuffix is off. The id was already a unique identifier on the
  // source CDN, so keeping it guarantees uniqueness here too.
  const cleaned = base
    .replace(/-opt-[a-f0-9-]+$/i, "") // strip a squareyards optimizer hash suffix, when present
    .replace(/-project-/, "-"); // "4s-aster-avenue-36-project-apartment-..." -> "...-avenue-36-apartment-..."
  const ext = originalUrl.match(/\.(\w+)$/)?.[1]?.toLowerCase() || "jpg";
  return `${cleaned}-gurgaon.${ext}`;
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN && !DRY_RUN) {
    console.error("BLOB_READ_WRITE_TOKEN is not set — refusing to run for real. Use --dry-run to preview without it.");
    process.exit(1);
  }

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".ts"));

  // Fail fast on any derived-slug collision before uploading anything —
  // addRandomSuffix is off, so two files resolving to the same blob path
  // would silently overwrite each other rather than error.
  const plannedSlugs = new Map();
  for (const file of files) {
    const content = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
    const match = content.match(URL_RE);
    if (!match) continue;
    const slug = deriveSlug(match[0]);
    if (plannedSlugs.has(slug)) {
      console.error(
        `Collision: "${file}" and "${plannedSlugs.get(slug)}" both derive "${slug}" — fix deriveSlug() before running for real.`
      );
      process.exit(1);
    }
    plannedSlugs.set(slug, file);
  }

  let migrated = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    let content = fs.readFileSync(filePath, "utf8");
    const match = content.match(URL_RE);
    if (!match) continue;

    const originalUrl = match[0];
    const slug = deriveSlug(originalUrl);
    console.log(`[${file}]`);
    console.log(`  from: ${originalUrl}`);
    console.log(`  to:   blog-heroes/${slug}`);

    if (DRY_RUN) {
      migrated++;
      continue;
    }

    try {
      const res = await fetch(originalUrl);
      if (!res.ok) {
        console.error(`  FAILED to fetch (HTTP ${res.status}) — left this post's URL untouched`);
        skipped++;
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());

      const blob = await put(`blog-heroes/${slug}`, buffer, {
        access: "public",
        contentType: res.headers.get("content-type") || "image/jpeg",
        addRandomSuffix: false,
      });

      // Both hero.imageUrl and social.ogImage hold this exact URL string —
      // replacing every occurrence catches both in one pass.
      content = content.split(originalUrl).join(blob.url);
      fs.writeFileSync(filePath, content);
      console.log(`  done -> ${blob.url}`);
      migrated++;
    } catch (err) {
      console.error(`  FAILED: ${err.message} — left this post's URL untouched`);
      skipped++;
    }
  }

  console.log(
    `\n${DRY_RUN ? "[dry run] would migrate" : "Migrated"} ${migrated} of ${files.length} posts` +
      (skipped ? `, ${skipped} failed and were left unchanged.` : ".")
  );
}

main().catch((err) => {
  console.error("[migrate-blog-hero-images] failed:", err);
  process.exit(1);
});
