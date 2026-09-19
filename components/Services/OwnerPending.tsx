import { OWNER_PENDING, type OwnerPendingKey } from "@/lib/content/ownerPending";

// R19-08 (2026-09-19): renders a commercial fact Homz has not yet supplied.
//
// Three states, deliberately:
//   - answered: renders as ordinary copy.
//   - unanswered, in development: renders a loud, unmistakable marker naming
//     the question and who owes it, so the team can see at a glance what is
//     blocking publication. data-owner-pending also makes it greppable and
//     assertable in a test.
//   - unanswered, in production: renders a neutral, truthful line. Internal
//     review notes are not something to show a visitor, and inventing a fee
//     or a mandate term to fill the gap is exactly what the recheck warns
//     against. Saying an advisor will confirm it is both true and useful.
//
// The page stays noindex while anything on it is unanswered (see
// app/sell-property-in-gurgaon/page.tsx), so this production state is what a
// visitor who was sent the link directly sees, not what Google indexes.
export default function OwnerPending({
  keyName,
  className,
}: {
  keyName: OwnerPendingKey;
  className?: string;
}) {
  const item = OWNER_PENDING[keyName];

  if (item.value) {
    return <span className={className}>{item.value}</span>;
  }

  if (process.env.NODE_ENV === "development") {
    return (
      <span
        className="inline-flex flex-wrap items-baseline gap-1.5 rounded-md border border-dashed border-[#E1684A]/50 bg-[#E1684A]/10 px-2 py-1 align-baseline text-[13px] text-[#f0967f]"
        data-owner-pending={keyName}
      >
        <strong className="font-bold uppercase tracking-wide">Owner input needed</strong>
        <span className="text-[#f0967f]/85">{item.question}</span>
        <span className="text-[#f0967f]/60">({item.owner})</span>
      </span>
    );
  }

  return (
    <span className={className} data-owner-pending={keyName}>
      We are finalising this and will confirm it with you directly before you commit
      to anything.
    </span>
  );
}
