import Link from "next/link";
import type { BlogPostV27 } from "@/lib/content/blogPostSchema";

// ONE compact footer for author + sources + editorial/AI disclosure — five
// separate equal-weight tail blocks bury the payoff, so sources and "how
// this was made" sit behind <details> toggles rather than adding vertical
// weight (_closing_structure.credibility_footer).
const CredibilityFooter = ({ post }: { post: BlogPostV27 }) => {
  const { author, reviewer, eeat } = post;
  return (
    <div className="rounded-2xl border border-gray-700 bg-black p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Written by</p>
          {author.profileUrl ? (
            <Link href={author.profileUrl} className="font-semibold text-white hover:text-[#CEA44E]">
              {author.name}
            </Link>
          ) : (
            <p className="font-semibold text-white">{author.name}</p>
          )}
          <p className="text-sm text-gray-400">{author.role}</p>
          <p className="mt-1 text-sm text-gray-400">{author.credentials}</p>
          <p className="mt-2 text-sm text-gray-500">
            Fact-checked by <span className="font-medium text-gray-300">{reviewer.name}</span> ({reviewer.role})
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-gray-300">{author.bioShort}</p>

      <details className="mt-4 border-t border-gray-800 pt-4">
        <summary className="cursor-pointer text-sm font-semibold text-gray-300 [&::-webkit-details-marker]:hidden">
          Sources & how this guide was made
        </summary>
        <div className="mt-3 space-y-3 text-sm text-gray-400">
          <p>{eeat.disclosure}</p>
          <p>{eeat.aiAssistanceDisclosure}</p>
          <div>
            <p className="mb-1.5 font-semibold text-gray-200">Sources</p>
            <ol className="list-decimal space-y-1 pl-5">
              {eeat.sources.map((s, i) => (
                <li key={i}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-[#CEA44E] hover:underline"
                  >
                    {s.label}
                  </a>{" "}
                  <span className="text-gray-600">— accessed {s.accessedAt}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </details>
    </div>
  );
};

export default CredibilityFooter;
