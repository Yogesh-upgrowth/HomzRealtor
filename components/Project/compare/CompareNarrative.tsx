import Link from "next/link";
import type { NormalizedProject } from "@/lib/intelligence/normalize";
import { formatInr } from "@/lib/intelligence/normalize";
import { keyDifferences, type CompareQuality } from "@/lib/intelligence/compareQuality";
import { projectStatusKind } from "@/lib/intelligence/projectStatus";
import { DataUpdated } from "@/components/Common/DataUpdated";

// Checklist item 11 (2026-09-22): "For indexable comparisons, don't stop at a
// table. Add: Quick overview, Price comparison, Location/connectivity,
// Configuration, Possession/status, Developer, RERA, Amenities, Current Homz
// inventory, Key differences. Then link back to both project pages."
//
// The table (ProjectCompare) already renders the raw field-by-field rows. This
// is everything the item asks for beyond it — written from the two records, so
// no two comparison pages read the same, and so nothing here is a claim the
// data does not support.
//
// WHAT THIS DELIBERATELY DOES NOT DO. It makes no recommendation. "Which
// should you buy" is the question a comparison page is tempted to answer, and
// we have no basis for it: no transaction prices, no construction-quality
// data, no knowledge of the reader's budget or timeline. Every section states
// what differs and why that difference matters to somebody, and stops there.
//
// Sections render only when both projects carry the data. A comparison with
// eight of ten sections missing is a thin page, which is exactly what the
// quality score in compareQuality.ts is there to keep out of the index — this
// component's job is not to pad it back up to length.

type Props = {
  a: NormalizedProject;
  b: NormalizedProject;
  hrefA: string;
  hrefB: string;
  quality: CompareQuality;
  asOf: string;
};

function Section({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="mt-10">
      <h2 id={id} className="mb-3 text-xl font-bold tracking-tight text-white">
        {heading}
      </h2>
      {children}
    </section>
  );
}

function TwoUp({
  a,
  b,
  labelA,
  labelB,
}: {
  a: string;
  b: string;
  labelA: string;
  labelB: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[
        { label: labelA, value: a },
        { label: labelB, value: b },
      ].map((c) => (
        <div key={c.label} className="rounded-xl border border-white/[0.08] bg-[#141416] px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{c.label}</p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-gray-300">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

const statusWords = (p: NormalizedProject) => {
  const kind = projectStatusKind(p.project_status);
  if (kind === "ready-to-move") return "Ready to move, so there is no construction-completion wait.";
  if (kind === "under-construction")
    return `Under construction${p.possession_text ? `, possession stated as ${p.possession_text}` : ""}.`;
  if (kind === "new-launch")
    return `New launch${p.possession_text ? `, possession stated as ${p.possession_text}` : ""}, with the full construction period ahead.`;
  return "Construction status is not stated in our records for this project.";
};

export default function CompareNarrative({ a, b, hrefA, hrefB, quality, asOf }: Props) {
  const differences = keyDifferences(a, b);
  const loc = (p: NormalizedProject) => p.sector || p.micro_market || p.city_name;

  const bothPriced = a.min_price_inr != null && b.min_price_inr != null;
  const bothSized = a.min_size != null && b.min_size != null && a.size_unit && b.size_unit;
  const bothConfig = Boolean(a.property_type && b.property_type);
  const bothAmenities = (a.amenities?.length ?? 0) > 0 && (b.amenities?.length ?? 0) > 0;
  const anyRera = Boolean(a.rera_id || b.rera_id);

  const sizeText = (p: NormalizedProject) =>
    `${p.min_size?.toLocaleString("en-IN")}${
      p.max_size && p.max_size > (p.min_size ?? 0) ? `–${p.max_size.toLocaleString("en-IN")}` : ""
    } ${p.size_unit}`;

  const reraText = (p: NormalizedProject) => {
    if (!p.rera_id) return "No RERA registration number in our records for this project.";
    if (p.rera_status === "active") return `${p.rera_id}, recorded as active.`;
    if (p.rera_status === "lapsed") return `${p.rera_id}, recorded as lapsed — verify on the HARERA portal.`;
    return `${p.rera_id}, registration status unverified in our records.`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2">
      {/* Quick overview */}
      <Section id="cmp-overview" heading="Quick overview">
        <p className="max-w-3xl text-[15.5px] leading-relaxed text-gray-300">
          {a.project_name} in {loc(a)} and {b.project_name} in {loc(b)} are both{" "}
          {a.property_category.toLowerCase()} projects
          {a.sector && a.sector === b.sector ? ` in the same sector` : ""}.
          {bothPriced
            ? ` Entry asking prices are ${formatInr(a.min_price_inr)} and ${formatInr(b.min_price_inr)} respectively.`
            : " At least one of the two is Price on Request, so entry prices cannot be compared directly."}{" "}
          {differences.length > 0
            ? `The differences that matter most are set out below.`
            : `On the fields we hold, the two records are closely matched.`}
        </p>
        <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-gray-500">
          This page compares what our catalogue records about each project. It does not
          recommend one over the other: we hold asking prices rather than transacted prices,
          and nothing here accounts for your budget, timeline or what you want from a home.
        </p>
      </Section>

      {/* Key differences */}
      {differences.length > 0 && (
        <Section id="cmp-differences" heading="Key differences">
          <ul className="space-y-2.5">
            {differences.map((d) => (
              <li
                key={d}
                className="rounded-xl border border-white/[0.08] bg-[#141416] px-5 py-3.5 text-[15px] leading-relaxed text-gray-300"
              >
                {d}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Price */}
      {bothPriced && (
        <Section id="cmp-price" heading="Price comparison">
          <TwoUp
            labelA={a.project_name}
            labelB={b.project_name}
            a={`From ${formatInr(a.min_price_inr)}${a.max_price_inr ? ` up to ${formatInr(a.max_price_inr)}` : ""}`}
            b={`From ${formatInr(b.min_price_inr)}${b.max_price_inr ? ` up to ${formatInr(b.max_price_inr)}` : ""}`}
          />
          <p className="mt-3 text-[13px] leading-relaxed text-gray-500">
            Asking prices from our own catalogue, not transacted prices, and negotiable.
          </p>
        </Section>
      )}

      {/* Location */}
      <Section id="cmp-location" heading="Location">
        <TwoUp
          labelA={a.project_name}
          labelB={b.project_name}
          a={[a.sector, a.micro_market, a.city_name].filter(Boolean).join(", ")}
          b={[b.sector, b.micro_market, b.city_name].filter(Boolean).join(", ")}
        />
      </Section>

      {/* Configuration and size */}
      {(bothConfig || bothSized) && (
        <Section id="cmp-config" heading="Configuration and unit size">
          <TwoUp
            labelA={a.project_name}
            labelB={b.project_name}
            a={[a.property_type, bothSized ? sizeText(a) : null].filter(Boolean).join(" · ")}
            b={[b.property_type, bothSized ? sizeText(b) : null].filter(Boolean).join(" · ")}
          />
        </Section>
      )}

      {/* Possession / status */}
      <Section id="cmp-status" heading="Possession and construction status">
        <TwoUp labelA={a.project_name} labelB={b.project_name} a={statusWords(a)} b={statusWords(b)} />
      </Section>

      {/* Developer */}
      <Section id="cmp-developer" heading="Developer">
        <TwoUp
          labelA={a.project_name}
          labelB={b.project_name}
          a={a.builder && a.builder !== "Unknown" ? a.builder : "No developer recorded."}
          b={b.builder && b.builder !== "Unknown" ? b.builder : "No developer recorded."}
        />
      </Section>

      {/* RERA */}
      {anyRera && (
        <Section id="cmp-rera" heading="RERA registration">
          <TwoUp labelA={a.project_name} labelB={b.project_name} a={reraText(a)} b={reraText(b)} />
          <p className="mt-3 text-[13px] leading-relaxed text-gray-500">
            A registration number on file is not the same as a current registration. Check the
            number against the HARERA portal before relying on it.
          </p>
        </Section>
      )}

      {/* Amenities */}
      {bothAmenities && (
        <Section id="cmp-amenities" heading="Amenities">
          <TwoUp
            labelA={a.project_name}
            labelB={b.project_name}
            a={`${a.amenities.length} listed by the developer.`}
            b={`${b.amenities.length} listed by the developer.`}
          />
          <p className="mt-3 text-[13px] leading-relaxed text-gray-500">
            Counts come from the developer&apos;s own listing and are not independently verified.
          </p>
        </Section>
      )}

      {/* Current Homz inventory — the link back to both project pages that
          item 11 closes with. */}
      <Section id="cmp-inventory" heading="Current HomzRealtor inventory">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { p: a, href: hrefA },
            { p: b, href: hrefB },
          ].map(({ p, href }) => (
            <Link
              key={p.slug}
              href={href}
              className="group rounded-xl border border-white/[0.08] bg-[#141416] px-5 py-4 transition hover:border-[#B77D2B]"
            >
              <p className="text-[15px] font-semibold text-white group-hover:text-[#CEA44E]">
                {p.project_name}
              </p>
              <p className="mt-1 text-[13px] text-gray-500">
                {[p.sector, p.city_name].filter(Boolean).join(", ")}
                {p.project_status ? ` · ${p.project_status}` : ""}
              </p>
              <p className="mt-2 text-[13px] text-[#D9B268]">
                See full details, pricing and availability →
              </p>
            </Link>
          ))}
        </div>
        {a.sector && (
          <p className="mt-4 text-[13.5px] text-gray-400">
            More in the same area:{" "}
            <Link
              href={`/project-listing/${a.city_key === "ggn" ? "gurgaon" : a.city_key}/sectors/${a.sector
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")}`}
              className="text-[#D9B268] hover:underline"
            >
              every project we list in {a.sector}
            </Link>
            .
          </p>
        )}
      </Section>

      {/* Transparency about why this page is or is not offered for indexing.
          A reader who reaches a noindex comparison should know it is a thin
          one rather than assume the site is hiding something. */}
      <div className="mt-10 rounded-xl border border-white/[0.06] bg-[#111113] px-5 py-4">
        <DataUpdated date={asOf} label="Project data updated" />
        {!quality.indexable && (
          <p className="mt-2 text-[12.5px] leading-relaxed text-gray-500">
            {quality.disqualifiedBy
              ? `We do not offer this comparison to search engines: ${quality.disqualifiedBy.toLowerCase()}`
              : `We do not offer this comparison to search engines — on our own quality score it reaches ${quality.score} of 100 against a ${quality.threshold} threshold, mostly because ${
                  quality.criteria.slice().sort((x, y) => x.earned / x.max - y.earned / y.max)[0].note.charAt(0).toLowerCase() +
                  quality.criteria.slice().sort((x, y) => x.earned / x.max - y.earned / y.max)[0].note.slice(1)
                }`}{" "}
            The two project pages above carry the full records either way.
          </p>
        )}
      </div>
    </div>
  );
}
