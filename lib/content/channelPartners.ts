// Developers HomzRealtor is an authorised channel partner for (2026-09-19).
//
// Named by the owner. Only the developers they actually named are listed: the
// statement ended "etc.", and an "etc." is not a list. Every earlier version
// of this claim on the site was removed precisely because it named five
// builders nobody could evidence, and re-adding unnamed ones would repeat
// that mistake.
//
// What this is, and is not:
//   - It is the business's own statement about its own commercial
//     relationships, which is the owner's to make, the same as the phone
//     number or the opening hours.
//   - It is NOT third-party verified, so it is rendered as plain prose and
//     never as structured data. Schema markup would present an unverified
//     commercial claim in the machine-readable form Google treats as an
//     assertion of fact, and there is no schema type that means "the
//     business says so".
//
// To make this properly load-bearing -- an authorised-partner badge on the
// specific project pages, which is where a buyer actually needs it -- what is
// needed is per-project authorisation: which projects, under which
// registration, valid until when. A developer name alone cannot be attached
// to a project page honestly, because a channel partner for one M3M project
// is not thereby a partner for all of them.

export const CHANNEL_PARTNER_DEVELOPERS = ["DLF", "M3M", "Central Park"] as const;

export const CHANNEL_PARTNER_STATEMENT =
  `HomzRealtor is an authorised channel partner for ${CHANNEL_PARTNER_DEVELOPERS.slice(0, -1).join(", ")} and ${CHANNEL_PARTNER_DEVELOPERS[CHANNEL_PARTNER_DEVELOPERS.length - 1]}, among other Gurgaon developers.`;

// Nothing is said here about who pays what on a developer booking. Channel
// partner commissions are commonly paid by the developer, but the owner has
// stated only the resale and letting rates (lib/content/brokerageTerms.ts),
// and a fee arrangement the business has not stated is not ours to describe.
