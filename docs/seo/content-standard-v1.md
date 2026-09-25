# Homz Content Standard v1

**Frozen 2026-09-22.** Page formats do not change again without a v2.

This document is the writer's and the reviewer's copy of the standard. The
machine-readable version is `lib/content/editorial/standard.ts`, and the two
must agree — the section ids below are the ids in that file, and a section
written against an id that is not there is rejected at module load.

---

## What is built, and what is not

**Built:** every slot, gate, check and render path. Sector and developer hubs
already mount the editorial components; they render nothing, because there is
nothing to render.

**Not built, deliberately:** the prose.

> "If you want to truthfully say the prose itself was not AI-written, the final
> narrative copy must be written/reworked and signed off by a human editor. I
> should not pretend AI-written copy is human-written."

Generating the narrative here would produce exactly the copy this standard
exists to prevent, and would leave two options — rewrite all of it, or
mislabel its authorship. The machinery ships ahead of the writer so the
writer's work is purely additive: copy lands in a registry and appears, with
no route change, no template change and no page rebuilt around it later.

---

## The three layers

| Layer | What it is | Where it lives | Written by |
|---|---|---|---|
| **A** | Structured facts: price, area, status, configuration, developer, sector, RERA, amenities | the catalogue feed, `lib/intelligence/normalize.ts` | nobody — computed |
| **B** | Computed Homz intelligence: sector medians, developer footprint, price position, stage mix, budget distribution, corridor concentration | `lib/intelligence/` | nobody — computed |
| **C** | Human editorial analysis | `lib/content/editorial/*Pages.ts` | a person |

**Never type a Layer A or B figure into a content file.** A median written into
TypeScript is wrong the day inventory moves. This is the same rule already
enforced by `lib/content/catalogueStats.ts` and `npm run check:content-stats`.

Layer C is not mechanically generated. That is the whole mechanism by which
these pages avoid reading as machine output.

---

## The workflow

| Step | Who | Output |
|---|---|---|
| 1. Homz data extraction | machine | `npm run build:dossier -- sector sector-65` |
| 2. External fact research | machine + person | RERA, official developer sites, government infrastructure sources, maps |
| 3. Research dossier | machine | `docs/editorial/dossiers/{type}-{key}.json` — facts, sources, numbers, questions, angle, competitive gaps. **No prose.** |
| 4. Narrative | **person** | the copy |
| 5. Fact check | person | every claim marked `Verified` / `Homz data` / `Official source` / `Editorial observation` |
| 6. SEO review | machine | keyword intent, coverage, headings, internal links, duplication, cannibalisation, schema |
| 7. Editorial signoff | **person** | the byline — and only if it is true |

The dossier at Step 3 contains no sentence that could be pasted into a page.
That is enforced by construction: it emits labels, numbers, questions and
notes, and has no field shaped like copy. If it ever grows one, Step 4 has
quietly become Step 3 and the authorship position has been abandoned.

---

## The authorship rule

Three honest states, and no fourth:

- **`human-written`** — a named person wrote the narrative. Renders
  *"Written by {name}"*, plus *"Reviewed by {reviewer}"* when there was one.
- **`human-edited`** — machine-drafted, then rewritten and fact-checked by a
  named person who stands behind it. Renders *"Drafted from HomzRealtor
  catalogue data, rewritten and fact-checked by {name}"*. A legitimate state.
  Claiming it is the one above is not.
- **`machine-generated`** — renders **no byline at all**, and cannot publish at
  any score.

There is no prop, flag or config that puts a "Written by" line over prose a
person did not write. `authorshipByline()` in
`lib/content/editorial/types.ts` is the single place a byline is constructed,
and `tests/content-standard.test.mjs` fails if that ever stops being true.

---

## The publish gate

A page renders its editorial layer only when **all three** hold:

1. `status: "published"`
2. a recorded rubric score of **90 or more**
3. authorship that is not `machine-generated`

Fail any one and the page renders what it renders today: the computed modules,
and no narrative. That is the correct failure mode. Half-published editorial
copy on a property page is worse than none.

Sections are gated individually too — a page can ship with twelve of sixteen
sections written, and the four unwritten ones simply do not appear.

---

## The quality score

`npm run check:content-standard` — eleven tests, 100 points, publish at 90+.

| Test | Points | Scored from |
|---|---|---|
| All factual claims sourced | 15 | the declared `claims` — provenance present, `sourceUrl` on every official-source claim, `verifiedAt` on every verified one, `homzField` on every computed one |
| Homz first-party data used | 15 | distinct Layer B fields cited (8pts) and how much of the page cites any (7pts) |
| Unique local analysis | 15 | banned phrasing, and noun-blinded shingle overlap against every sibling page |
| Buyer questions answered | 10 | FAQs answered in 25+ words, against the per-type minimum |
| Real disadvantages and tradeoffs | 10 | the structured `doesNotSuit` list — **zero if it is empty** |
| Current pricing methodology disclosed | 10 | the provenance block, and whether the prose itself says "asking price" |
| Internal links correct | 5 | every internal link on a known route family, at least 8 of them |
| RERA and status checked | 5 | source and check date declared; **zero** for a blanket "X is RERA approved" |
| No competitor or copied content | 5 | portal names, banned phrasing |
| Human editorial review | 5 | authorship — attested, not computed |
| 2,000+ useful words | 5 | prose words, markdown and link targets stripped |

Word count is 5 points on purpose. A 2,400-word page of filler scores worse
than a 1,900-word page that says something.

**Declaring no claims scores 0 on the sourcing test, not 15.** A 2,500-word
market analysis with nothing declared has not been through Step 5 at all, and
scoring it full marks would reward skipping the step.

---

## The anti-spinning check

> "Sector 65 is one of Gurgaon's most sought-after residential destinations…
> Sector 70 is one of Gurgaon's most sought-after residential destinations…
> That isn't unique content. Changing nouns doesn't make it unique."

Two mechanisms, in `lib/content/editorial/originality.ts`:

1. **Banned phrasing** — 15 patterns, including every example the standard
   names by hand, plus future price predictions (the standard allows analysis
   of present data only).
2. **Noun-blinded similarity** — sector numbers, prices, rates, plain numbers
   and any supplied developer or place name are replaced with placeholders
   *before* comparison, then both pages are shingled into 8-word runs. Those
   two sentences above reduce to the **same string** and score 100% overlap.

The ceiling is 15% shared runs. That leaves room for the boilerplate that
*should* be identical everywhere — the asking-price disclosure, the RERA
caution — and none for a shared argument.

---

## Section structure

### Sector pages

| # | id | Layer | Words | What it does |
|---|---|---|---|---|
| 1 | `quick-answer` | C | 120–150 | Established or developing, mix, entry price, buyer type, corridor, stage mix |
| 2 | `at-a-glance` | B | — | Computed table |
| 3 | `what-its-like` | C | 250–350 | Where it sits, how it relates to neighbours, roads, character |
| 4 | `prices` | C | 300–400 | Explain the median, the range and the spread |
| 5 | `budgets` | C | 250–400 | <₹1 Cr / ₹1–2 / ₹2–4 / ₹4+, from live inventory, empty bands stated |
| 6 | `residential` | C | 250–300 | Type and BHK mix, stage mix |
| 7 | `commercial` | C | 150–300 | Only where there is meaningful inventory |
| 8 | `major-projects` | C | 300–600 | Shortlist with stated criteria, ~70–100 words each, each linked |
| 9 | `developers` | C | 200–350 | Actual presence, linked to hubs |
| 10 | `connectivity` | C | 300–450 | Verified distances, straight-line kept distinct from drive time |
| 11 | `infrastructure` | C | 250–400 | Schools, healthcare, shopping, daily needs, employment — verified only |
| 12 | `suitability` | C | 200–350 | Both sides |
| 13 | `vs-nearby` | C | 300–500 | Two or three real comparisons |
| 14 | `market-read` | C | 250–400 | Present data only. No price predictions |
| 15 | `faqs` | C | 400–900 | 10–15 real questions |

### Developer pages

`quick-answer` · `portfolio-snapshot` (B) · `about` (A — verified entity facts
only) · `gurgaon-history` · `footprint` · `price-analysis` ·
`residential-portfolio` · `commercial-portfolio` · `pipeline` ·
`ready-inventory` · `by-corridor` · `notable-projects` · `rera` ·
`suitability` · `verify` · `faqs` (15 questions)

**"About the developer" is Layer A, not Layer C.** It comes from
`lib/content/developerProfiles.ts`, where every fact carries a source URL and a
checked date. Do not write company history into the editorial registry. The
section that belongs there is `gurgaon-history` — when they became active
*here*, which micro-markets define the portfolio, how the mix has changed.

**Never "X is RERA approved."** Registration is granted per project and per
phase. The rubric fails a page for it.

### Project pages

`overview` · `facts` (A) · `configurations` · `price-analysis` ·
`sector-position` · `location` · `infrastructure` · `amenities` ·
`developer-context` (**100–150 words and a link — never a repeated 500-word
biography across a hundred pages**) · `status-rera` · `suitability` ·
`check-before-buying` · `alternatives` · `faqs`

Project pages get editorial copy only after their structured facts pass QA
(`npm run check:publish-gate`). Writing 2,500 words about a project whose
possession status contradicts its own payment plan publishes the contradiction
in prose, where it is far harder to correct than in a data field.

---

## Word-target arithmetic: a known discrepancy

The stated page targets are 2,500–3,500 words for a sector, 2,500–4,000 for a
developer, 2,000–3,000 for a project. The per-section minimums sum to **3,520 /
3,550 / 2,500** — writing every section at its own minimum already exceeds the
sector and developer page targets. Both numbers cannot be met at once.

This standard treats the **section** targets as the guide, because that is what
a writer works to, and the page range as the headline. If the page range is the
binding constraint instead, compress the sections with no stated target
(`major-projects`, `notable-projects`, the FAQ blocks) rather than the
analytical ones. It is a decision to make, not a rounding error.

---

## "About this page's data"

Renders on every sector and developer hub **today**, with or without editorial
copy, because everything it declares is already true of the computed figures:

```
Homz catalogue snapshot   computed at render — never a stored date
Price type                Listed asking price
Transactions              not claimed
Project status            catalogue + RERA where registered
RERA source               Haryana RERA, with the date it was checked
Infrastructure            OSM extracts; straight-line and drive time kept apart
Editorial review          only when a person actually reviewed
```

Then **Sources** — the platform references plus every `sourceUrl` declared on a
claim, de-duplicated.

---

## Rollout

**Batch 1 — 20 sectors:** 56, 43, 65, 48, 102, 54, 67, 70, 79, 113, 37D, 82,
84, 85, 89, 92, 99A, 109, 111, 106.

**Batch 2 — 15 developers:** DLF, M3M, Emaar, Signature Global, Godrej, Central
Park, Adani, Sobha, Bestech, BPTP, Vatika, ATS, AIPL, Conscient, Tulip.
Ordered by portfolio depth *and* commercial search importance — which is why
Ansal (65 projects) and Unitech (62) sit below developers with fewer.

**Batch 3 — projects:** ordered by Search Console demand. That export is not in
this repository, so the queue cannot be built here; it is an input.

**Batch 4 — sale/rental locality pages.**

**Prototypes: `sector-65` and `dlf`.** They define the standard for everything
after them.

**Do not create separate 2,000-word pages for every filter.** One exceptionally
strong hub, and a child page only where there is independent intent *and*
sufficient inventory. This continues the crawl-control policy already in
`lib/intelligence/developerViews.ts`.

---

## Adding a page

```bash
npm run build:dossier -- sector sector-65     # Step 1–3
# a person writes the narrative                 Step 4
# mark every claim in section.claims            Step 5
# add the page to lib/content/editorial/sectorPages.ts with status: "draft"
npm run check:content-standard                # Step 6 — score it
# at 90+, record the score in review and set status: "published"   Step 7
```

Below 90 it stays draft and renders nothing. That is the gate working.

---

## Commands

| Command | What it does |
|---|---|
| `npm run check:content-standard` | Score every registered page. Fails only on a page marked published that does not pass, or on format drift |
| `npm run check:content-standard -- --verbose` | Per-test breakdown for every page |
| `npm run build:dossier -- sector sector-65` | Research dossier, Layer A + B, no prose |
| `npm run build:dossier -- developer dlf` | Same for a developer |
| `npm run check:developer-coverage` | Which developers still lack verified entity facts, most inventory first |
| `npm run check:publish-gate` | Project data-quality findings — run before writing a project page |
| `npm run test:content-standard` | The authorship rule, the publish gate and the anti-spinning detector |

Both scripts exit **2** when the catalogue feed is unreachable, never 0 — an
unreachable feed can never be mistaken for an empty result.
