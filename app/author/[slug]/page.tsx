import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { AUTHORS, authorBySlug } from "@/lib/content/authors";
import { BLOG_POSTS_V27 } from "@/lib/content/blogRegistry";
import { COMPANY_INFO } from "@/lib/seo/companyInfo";

// Author profile pages (2026-09-21).
//
// Every editorial piece on the site was bylined to an author slug that had no
// page behind it, so the byline linked nowhere and blogPostSchema's own
// contract for `author.profileUrl` could not be honoured. See
// lib/content/authors.ts for what this page states and, more importantly, for
// what it deliberately does not claim.

const SITE = "https://www.homzrealtor.com";

export function generateStaticParams() {
  return Object.keys(AUTHORS).map((slug) => ({ slug }));
}

type PageParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const author = authorBySlug(slug);
  if (!author) return {};

  const url = `${SITE}/author/${author.slug}`;
  const description = `${author.name}, ${author.role} at HomzRealtor. How our Gurgaon property research is produced, what it is computed from, and what it does not cover.`;
  return {
    title: `${author.name}, ${author.role}`,
    description,
    alternates: { canonical: url },
    openGraph: { title: author.name, description, url, type: "profile" },
  };
}

const safeJson = (g: unknown) =>
  JSON.stringify(g)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

export default async function AuthorPage({ params }: PageParams) {
  const { slug } = await params;
  const author = authorBySlug(slug);
  if (!author) notFound();

  const url = `${SITE}/author/${author.slug}`;
  const posts = BLOG_POSTS_V27.filter((p) => p.author.name === author.name).sort((a, b) =>
    b.meta.updatedAt.localeCompare(a.meta.updatedAt)
  );

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
          { "@type": "ListItem", position: 3, name: author.name, item: url },
        ],
      },
      {
        "@type": "ProfilePage",
        url,
        mainEntity: {
          // Organization for a collective byline, Person only for a real
          // individual — see the note in lib/content/authors.ts about why the
          // named people at this business are not bylined on work they did
          // not write.
          "@type": author.schemaType,
          name: author.name,
          url,
          jobTitle: author.role,
          description: author.bio[0],
          ...(author.schemaType === "Organization"
            ? { parentOrganization: { "@id": `${SITE}/#organization` } }
            : { worksFor: { "@id": `${SITE}/#organization` } }),
        },
      },
      ...(posts.length > 0
        ? [
            {
              "@type": "ItemList",
              numberOfItems: posts.length,
              itemListElement: posts.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: p.meta.h1,
                url: `${SITE}/blog/${p.meta.slug}`,
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <div className="bg-[#0B0B0C] min-h-screen text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(structuredData) }} />

      <div className="w-full max-w-4xl mx-auto px-4 pt-28 pb-16 md:pt-32 md:pb-24">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-[#D9B268]">Home</Link>
          <ChevronRight size={12} />
          <Link href="/blog" className="hover:text-[#D9B268]">Blog</Link>
          <ChevronRight size={12} />
          <span className="text-gray-300 font-medium">{author.name}</span>
        </nav>

        <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#D9B268]">
          {author.role}
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">{author.name}</h1>

        <div className="mt-5 space-y-4">
          {author.bio.map((p, i) => (
            <p key={i} className="text-[15.5px] leading-relaxed text-gray-300">
              {p}
            </p>
          ))}
        </div>

        <section aria-labelledby="method" className="mt-12">
          <h2 id="method" className="mb-4 text-2xl font-bold tracking-tight text-white">
            How this research is produced
          </h2>
          <ul className="space-y-3.5">
            {author.method.map((m, i) => (
              <li
                key={i}
                className="rounded-xl border border-white/[0.08] bg-[#141416] px-5 py-4 text-[15px] leading-relaxed text-gray-300"
              >
                {m}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="limits" className="mt-12">
          <h2 id="limits" className="mb-4 text-2xl font-bold tracking-tight text-white">
            What this does not cover
          </h2>
          <ul className="space-y-3.5">
            {author.limits.map((l, i) => (
              <li
                key={i}
                className="rounded-xl border border-white/[0.08] bg-[#141416] px-5 py-4 text-[15px] leading-relaxed text-gray-300"
              >
                {l}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="accountable" className="mt-12">
          <h2 id="accountable" className="mb-4 text-2xl font-bold tracking-tight text-white">
            Who answers for it
          </h2>
          <div className="rounded-2xl border border-white/[0.08] bg-[#141416] px-6 py-6">
            <p className="text-[15px] leading-relaxed text-gray-300">
              {COMPANY_INFO.legalStructure} {COMPANY_INFO.hareraHolder} holds HARERA agent
              registration {COMPANY_INFO.hararaAgentNumber}
              {COMPANY_INFO.hareraValidUntil
                ? `, valid to ${new Date(COMPANY_INFO.hareraValidUntil).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}`
                : ""}
              , and is the person accountable for what is published here.
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-gray-400">
              If something on this site is wrong, say so and it gets corrected. Call{" "}
              <a href={`tel:${COMPANY_INFO.phone}`} className="text-[#D9B268] hover:underline">
                {COMPANY_INFO.phoneDisplay}
              </a>{" "}
              or{" "}
              <Link href="/contact" className="text-[#D9B268] hover:underline">
                write to us
              </Link>
              . A corrected guide helps the next reader as much as it helps you.
            </p>
            <p className="mt-4 text-[13.5px]">
              <Link href="/about-us#credentials" className="text-[#D9B268] hover:underline">
                Full registration and company details
              </Link>
            </p>
          </div>
        </section>

        {posts.length > 0 && (
          <section aria-labelledby="published" className="mt-12">
            <h2 id="published" className="mb-1 text-2xl font-bold tracking-tight text-white">
              Published guides
            </h2>
            <p className="mb-5 text-[13px] text-gray-500">
              {posts.length} {posts.length === 1 ? "guide" : "guides"}, most recently updated
              first.
            </p>
            <ul className="space-y-3">
              {posts.map((p) => (
                <li
                  key={p.meta.slug}
                  className="border-b border-white/[0.06] pb-3 last:border-b-0"
                >
                  <Link
                    href={`/blog/${p.meta.slug}`}
                    className="text-[15.5px] font-medium text-gray-200 transition hover:text-[#D9B268]"
                  >
                    {p.meta.h1}
                  </Link>
                  <p className="mt-0.5 text-[12.5px] text-gray-500">
                    <span className="capitalize">{p.meta.category.replace(/-/g, " ")}</span>
                    {" · updated "}
                    <time dateTime={p.meta.updatedAt}>
                      {new Date(p.meta.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
