# Developer handoff — 22 September 2026

Four items that could not be completed from the environment the SEO work was
done in. Everything else on the 24-item checklist is shipped on
`yogesh-changes` (commits `60254e6`…`8659bb6`).

Each item below says what is blocked, why, exactly what to run, and how to tell
it worked. None of them require reading the rest of the codebase first.

| # | Item | Needs | Rough effort |
|---|---|---|---|
| 1 | Recalculate the editorial statistics | Network access to the catalogue feed | 1–3 hours, mostly copy edits |
| 2 | Validation rules in the source database | Access to `homz-scrape` | 1–2 days |
| 3 | Verify the 410 / 301 / noindex responses | A deployed URL | 15 minutes |
| 4 | Set `CRON_SECRET` on Vercel | Vercel project access | 5 minutes |

Do **4** first — it takes five minutes and the monthly job silently does nothing
until it is done. Then **3**, then **1**. **2** is the only large one.

---

## 1. Recalculate the editorial statistics

### What is wrong

25 blog guides quote hard numbers: "2,098 Gurgaon projects" in nine files,
"1,463 residential projects" in fifteen, plus sector counts, corridor counts,
ready-to-move shares and medians. 503 occurrences across 30 distinct figures.

**All of them are stale, and we made them stale.** They were measured on
4 September 2026. Since then this repo started:

- correcting residential projects misfiled as commercial (moves the
  residential/commercial split),
- collapsing duplicate project records (lowers every total),
- dropping owner-excluded records (lowers every total).

So "1,463 residential" is definitely wrong now, and "2,098 total" almost
certainly is.

### Why it was not done here

The environment the work was done in returns **HTTP 403** for
`https://homz-scrape.vercel.app/api/data`. Without the feed the live values
cannot be computed. The tooling to compute them is written and tested; it just
needs to run somewhere with network access.

### What to run

```bash
npm install
npm run check:content-stats
```

Run it anywhere the feed is reachable — a laptop, a Vercel preview shell, CI.
If the feed lives somewhere else, point at it:

```bash
HOMZ_FEED_BASE="https://your-feed-host/api/data" npm run check:content-stats
```

Exit codes:

| Code | Meaning |
|---|---|
| 0 | No drift. Every published figure matches the live catalogue. |
| 1 | Drift found. Output lists what moved and where. |
| 2 | Feed unreachable — **nothing was checked**. Not a pass. |

### What you get

A table of every declared figure with its stated and live value, then, for each
one that moved, the file and line of every sentence carrying it:

```
Gurgaon residential projects
  Gurgaon projects whose corrected category is Residential. Moves when
  dataQuality reclassifies a misfiled commercial record.
  stated 1,463 -> live 1,512  (+3%)
    lib/content/blog/ready-to-move-flats-in-gurgaon.ts:50   "Of 1,463 live residential projects, 1,190 (81%) are ready to move..."
    lib/content/blog/flats-in-gurgaon-under-1-crore.ts:104  "263 of 1,463 residential projects citywide price under ₹1 Cr"
    ...
```

`--json` gives the same data machine-readably. `--offline` lists the
occurrences without contacting the feed (useful for scoping the work first).

### What to change

For each drifted figure, two edits:

1. **The prose**, at every `file:line` listed.
2. **`lib/content/catalogueStats.ts`**, the `value:` on that stat's entry, so
   the checker passes afterwards and catches the *next* drift.

Then re-run `npm run check:content-stats` until it exits 0.

### Three things to get right

**Do not find-and-replace.** Surfaces are matched on digits, so two different
claims sharing a number are both reported. `34` is the New Gurgaon sector count
*and* appears in "DLF is the dominant builder on Golf Course Road (34 of 103
live projects)". The output is a list of lines to **read**. The script says this
itself in its header comment.

**Rewrite the argument, not just the digit.** Several sentences reason from
their figure — "1,190 of 1,463, about 81%, are ready to move, so finished stock
dominates this market". If the counts move, the percentage and the conclusion
move with them. A guide with a corrected number and an uncorrected argument is
worse than one that was simply out of date.

**Check the internal arithmetic.** `gurgaon-property-price-trends-2026.ts` has a
band table (73 + 190 + 361 + 527) that must sum to the `gurgaonResidentialWithPrice`
figure, and an explicit sentence about the 312 unpriced projects that is derived
from the difference between that and `gurgaonResidentialProjects`. Both need
updating together.

### Also update the snapshot dates

Every guide carries `eeat.productDataHook.dateRange`, `eeat.lastVerifiedAt` and
prose like "snapshotted 4 September 2026". If the numbers are recomputed on, say,
2 October, those dates must say 2 October. A corrected figure under a September
date is a new inaccuracy, not a fix.

### Done when

- `npm run check:content-stats` exits 0
- `npm test` passes (319 cases)
- `npx tsc --noEmit` clean
- `npx next build --webpack` clean

---

## 2. Validation rules in the source database

### What is wrong

Checklist items 1, 2 and 9 ask for validation rules "so impossible combinations
cannot be saved", and for competitor content to be fixed "in the source
database/content repository, not just front-end HTML".

**This repository cannot do either.** It has no database and no publish step:
every record is fetched from the `homz-scrape` feed at request time and
rendered. There is nothing here to validate *on save*, because nothing is saved.

### What this repo does instead

Two layers, both of which stay useful once the source is fixed:

1. **Corrections at the read boundary** (`lib/intelligence/dataQuality.ts`) — a
   flat typed as a warehouse is reclassified before anything renders; competitor
   sentences are stripped from prose and from structured fields.
2. **A publish gate** (`lib/intelligence/publishGate.ts`) — anything still
   broken after those corrections is withheld from indexing (`noindex,follow`)
   and dropped from the sitemap, while still rendering for a visitor who has
   the URL.

The gate is the backstop. It stops us *publishing* a bad record. It cannot stop
one *existing*, and every bad record still costs a URL that could have been
indexed.

### See the size of the problem first

```bash
npm run check:publish-gate
```

Reports how many projects and listings are being withheld, grouped by rule, with
examples and a link each. `--json` for the full set, `--rule=<name>` to focus.
Exits 2 if the feed is unreachable.

That output is the work queue for this item: it is literally the list of records
`homz-scrape` is emitting that we will not publish.

### Rules to implement at the source

These mirror `lib/intelligence/publishGate.ts` exactly. Same names, so a fix at
the source can be confirmed by the count dropping in the report above.

**Reject on save (impossible or contradictory):**

| Rule | Condition |
|---|---|
| `residentialCommercialType` | `property_type` in (office, retail_shop, showroom, warehouse, co_working) AND (`bedrooms` > 0 OR title/configuration matches `\d+\s*(BHK\|RK)`) |
| `residentialConfigOnCommercial` | `project_category` = Commercial AND `BHKType` matches `\d+\s*(BHK\|RK)` |
| `readyToMoveFuturePossession` | status is ready-to-move (`ready to move`, `RTM`, `completed`, `delivered`) AND possession year > current year |
| `nonPositivePrice` | any price field present and `<= 0` |
| `nonPositiveArea` | any area field present and `<= 0` |
| `shortOrInvalidDeveloper` | developer name < 3 chars, or in the stopword list (`the`, `j`, `new`, `luxury`, `sector`, `apartment`, `huda`…) |
| `competitorContent` | any text field matches Square Yards, MagicBricks, 99acres, Housing.com, NoBroker, PropTiger, CommonFloor, Makaan, Quikr, OLX |
| `zeroDistanceLandmark` | a landmark distance of exactly 0.0 km |

**Flag for review (do not reject):**

| Rule | Condition |
|---|---|
| `residentialWordsOnCommercial` | Commercial category, copy says "residential" or "apartments" |
| `noDeveloper` | no developer name parseable |
| `noLocation` | no sector and no micro-market |
| `reraMalformed` | a RERA id is present but is junk (`N/A`, `0000`, `-`) |

### Two rules that are about ABSENCE and must not be tightened

- **Price on Request is legitimate.** The rule is `price <= 0`, *not* "price
  missing". Thousands of real records have no price. Rejecting those would
  remove most of the catalogue.
- **A missing RERA id is legitimate.** Plenty of older projects genuinely have
  none. Only a *present-but-junk* value is a problem.

Both have tests in `tests/publish-gate.test.mjs` asserting the absent case stays
clean. Mirror that discipline at the source.

### Competitor content (item 2)

`stripCompetitorProse()` removes whole *sentences* containing a competitor name,
not just the name — deleting only the brand leaves "…exceptional legal team can
assist you", which now reads as ours and is worse than the original.

At the source, the checklist asks for affected paragraphs to be **rewritten as
original HomzRealtor content**. That was deliberately not attempted here: it
means writing new marketing prose for thousands of records with no source
material, which is content generation, not a data fix. It needs a human decision
about whether those paragraphs should be rewritten or simply removed.

### Done when

`npm run check:publish-gate` shows blocking-rule counts trending toward zero.
It will never be zero — a feed aggregated from third parties always carries some
malformed records. The number that matters is the trend.

---

## 3. Verify the redirect and indexing responses

### What is wrong

Nothing, as far as can be told without a server. These all compile and are
unit-tested, but nothing here can issue an HTTP request to a running instance,
so no status code has actually been observed.

### After deploying `yogesh-changes`, run these

Replace the host if testing a preview deployment.

```bash
SITE=https://www.homzrealtor.com

# 410 Gone — a slug that can never be a developer.
curl -sI "$SITE/developer/the"    | head -1   # expect: HTTP/2 410
curl -sI "$SITE/developer/j"      | head -1   # expect: HTTP/2 410

# 301 — an alias slug redirects to the canonical developer hub.
curl -sI "$SITE/developer/emaar-india"        | grep -iE '^(HTTP|location)'
# expect: 301, location: /developer/emaar
curl -sI "$SITE/developer/godrej-properties"  | grep -iE '^(HTTP|location)'
# expect: 301, location: /developer/godrej

# 200 — a real developer must NOT be caught by either rule.
curl -sI "$SITE/developer/dlf"    | head -1   # expect: HTTP/2 200
curl -sI "$SITE/developer/m3m"    | head -1   # expect: HTTP/2 200
curl -sI "$SITE/developer/rof"    | head -1   # expect: HTTP/2 200

# Host, protocol and case canonicalisation — each a single 308 hop.
curl -sI "http://homzrealtor.com/buy-property" | grep -iE '^(HTTP|location)'
# expect: 308, location: https://www.homzrealtor.com/buy-property
curl -sI "$SITE/project-listing/Gurgaon"       | grep -iE '^(HTTP|location)'
# expect: 308, location: .../project-listing/gurgaon

# Filter and sort URLs: noindex,follow AND no canonical tag.
curl -s "$SITE/buy-property?bedrooms=3" | grep -iE '<meta name="robots"|rel="canonical"'
# expect: a robots meta with noindex,follow — and NO canonical line at all
curl -s "$SITE/buy-property?sort=price-low" | grep -iE '<meta name="robots"|rel="canonical"'
# same

# The clean hub must be unaffected.
curl -s "$SITE/buy-property" | grep -iE '<meta name="robots"|rel="canonical"'
# expect: a canonical to /buy-property, and NO noindex
```

### The one that matters most

The last three. A filtered URL emits `noindex,follow` **and no canonical tag**.
That combination is deliberate and is the thing most likely to be "helpfully"
changed by someone later.

If a filtered URL carried both `noindex` *and* `canonical → /buy-property`,
Google may follow the canonical and apply the noindex to its target — taking the
clean hub out of the index. If you see a canonical tag on a filtered URL,
that is a regression, not a fix.

### Also worth one look

```bash
curl -s "$SITE/sitemap.xml"                    # 8 <sitemap> entries
curl -s "$SITE/sitemap/comparisons.xml" | head # should exist, may be empty
```

`comparisons.xml` being empty is fine and expected if no project pair currently
clears the quality threshold (70/100, see `lib/intelligence/compareQuality.ts`).

---

## 4. Set `CRON_SECRET` on Vercel

### What is wrong

`vercel.json` now has a third cron entry:

```json
{ "path": "/api/index-snapshot", "schedule": "0 5 1 * *" }
```

It captures the monthly Gurgaon Property Index snapshot on the 1st of each
month. The route requires `CRON_SECRET` (the same variable
`/api/status/sync` already uses — Vercel Cron sends it automatically as a
bearer token).

**If `CRON_SECRET` is not set, the route returns 503 and no snapshot is ever
written.** Nothing on the site breaks; `/gurgaon-property-index` simply keeps
saying it has no data, and the loss is permanent — a month not captured cannot
be reconstructed later, by design.

### What to do

Vercel → Project → Settings → Environment Variables → confirm `CRON_SECRET`
exists for **Production**. If `/api/status/sync` is already running on its
daily cron, it is set and there is nothing to do.

If not, add any strong random value:

```bash
openssl rand -hex 32
```

### Verify

```bash
# Without the header: expect 401 (or 503 if the secret is unset).
curl -sI "https://www.homzrealtor.com/api/index-snapshot" | head -1

# With it: expect 200 and a JSON capture summary.
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  "https://www.homzrealtor.com/api/index-snapshot"
# {"month":"2026-09","attempted":<n>,"inserted":<n>,"alreadyRecorded":0}
#   `attempted` is the number of scopes captured — the city, the rental
#   inventory, and every sector and corridor holding at least 8 listings.
```

Running it twice in the same month is safe — the second call returns
`inserted: 0` with `alreadyRecorded` equal to the first run's `attempted`. A month already on record is never
overwritten; that is enforced by a unique database index, not by convention,
and the whole value of the index depends on it.

Then load `/gurgaon-property-index` — it should show the month's figures instead
of "the first snapshot has not been captured yet".

### Do not

- Do not add a backfill route or write past months by hand. The catalogue
  records what is listed *now* and holds nothing about 2023; any reconstructed
  history would be a guess with a dataset's authority. `trendBetween()` refuses
  to compare across a definition change for the same reason.
- Do not change the cron to run more often expecting more data points. The unit
  is the month; extra runs are no-ops.

---

## Reference: the checks now available

All safe to run repeatedly. The three marked ★ need feed access.

```bash
npm test                      # 319 cases, 11 suites
npx tsc --noEmit              # clean
npx eslint .                  # baseline is 22 errors / 10 warnings — report only NEW ones
npx next build --webpack      # the known-good build (plain `npm run build` OOMs on most machines)
npx next build                # ALSO required when touching sitemap/robots/metadata routes

npm run check:orphans         # every route family has an inbound link
npm run check:canonicals      # every indexable route has a canonical or explicit noindex
npm run check:content-stats ★ # item 1 above
npm run check:publish-gate  ★ # item 2 above
npm run check:data-quality  ★ # data-error counts by check
npm run check:sitemap       ★ # sitemap URL reconciliation
```

## Reference: where the new logic lives

| Concern | File |
|---|---|
| Feed corrections (classification, competitor text) | `lib/intelligence/dataQuality.ts` |
| Publish gate / needs-review rules | `lib/intelligence/publishGate.ts` |
| Canonical developer table, aliases, invalid slugs | `lib/content/developers.ts` |
| 410 / 301 for developer URLs | `middleware.ts` |
| Construction-status semantics | `lib/intelligence/projectStatus.ts` |
| Declared editorial figures | `lib/content/catalogueStats.ts` |
| Investment Score components and limits | `lib/intelligence/investmentScoreMeta.ts` |
| Comparison quality scoring | `lib/intelligence/compareQuality.ts` |
| Filter/sort indexing policy | `lib/listings/filters.ts` → `isIndexableListingUrl()` |
| Property Index storage and trends | `lib/index/snapshot.ts`, `lib/index/types.ts` |
| Homepage news allow-list | `lib/intelligence/news.ts` |

Every one of those files opens with a comment explaining what it does, why it
exists, and what it deliberately does not do. Read the header before changing
the logic — several of the rules look arbitrary until you know which specific
bug produced them.
