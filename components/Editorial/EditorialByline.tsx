import Link from "next/link";

import { EDITORIAL_TEAM_SLUG } from "@/lib/content/authors";
import { authorshipByline, type EditorialPage } from "@/lib/content/editorial/types";

// The byline — workflow Step 7 (2026-09-22).
//
// "Display: Written by HomzRealtor Editorial Team / Reviewed by HomzRealtor
//  Research Team — only if that is actually what happened. Do not falsely
//  claim human authorship if the content wasn't human-written."
//
// This component is that rule rendered. It has no default text and no
// fallback: `authorshipByline()` returns null for machine-generated copy and
// this returns null with it. There is no prop, no flag and no config that
// produces a "Written by" line over prose a person did not write.
//
// The same rule already governs lib/content/authors.ts, which refuses to
// attribute the 25 existing guides to the HARERA-registered proprietor or the
// named advisor because they did not write them. A fabricated byline on
// financial-advice content is the precise behaviour the E-E-A-T signal exists
// to detect, and a site that fakes it is betting its whole domain on not being
// caught.
//
// The author link points at /author/{slug} only when a real profile page
// exists for that name, matching the contract in lib/content/blogPostSchema.ts
// ("only set once a genuine published profile page exists — never a
// placeholder").

const PROFILED_NAMES = new Set(["Homz Realtor Editorial Team", "HomzRealtor Editorial Team"]);

export default function EditorialByline({ page }: { page: EditorialPage | null }) {
  if (!page) return null;
  const authorship = page.authorship;
  // Narrowed here rather than after authorshipByline(): the null return and
  // the machine-generated case are the same fact, and saying it once keeps the
  // rule visible instead of hidden behind a non-null assertion.
  if (authorship.kind === "machine-generated") return null;
  const byline = authorshipByline(authorship);
  if (!byline) return null;

  const name = authorship.kind === "human-written" ? authorship.writer : authorship.editor;
  const hasProfile = PROFILED_NAMES.has(name);

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <p className="max-w-3xl border-l-2 border-[#B77D2B]/40 pl-3 text-[13px] leading-relaxed text-gray-400">
        {hasProfile ? (
          <>
            {byline.primary.replace(name, "")}
            <Link href={`/author/${EDITORIAL_TEAM_SLUG}`} className="text-gray-300 underline hover:text-[#D9B268]">
              {name}
            </Link>
          </>
        ) : (
          byline.primary
        )}
        {byline.secondary && <span className="text-gray-500"> · {byline.secondary}</span>}
      </p>
    </div>
  );
}
