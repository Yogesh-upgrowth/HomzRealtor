// Project detail pages stream their main content in behind a
// <Suspense fallback={<IntelligenceSkeleton />}> (ProjectIntelligenceSections,
// which fetches project/price/geo/AI data) — the enquiry form (#enquire)
// sits in a sibling column that, on mobile, stacks *after* that streamed
// content in normal document flow. A plain `<a href="#enquire">` computes
// its scroll target once, at click time: if the skeleton hasn't yet been
// replaced by the real (much taller) content, the browser scrolls to where
// #enquire currently sits, then the page grows underneath and the user ends
// up scrolled past the form once streaming finishes — reported live as
// "clicking Enquire doesn't take you to the form."
//
// Fixes that with a real re-scroll: scroll now, then watch for the page's
// height to change (the skeleton→content swap) and correct once when it
// does, rather than trusting a single scroll computed against a page that's
// still growing underneath the user.
export function scrollToHash(hash: string, e?: { preventDefault: () => void }): boolean {
  if (!hash.startsWith("#") || hash.length < 2) return false;
  if (typeof document === "undefined") return false;

  const el = document.getElementById(hash.slice(1));
  if (!el) return false;

  e?.preventDefault();

  const scroll = () => el.scrollIntoView({ behavior: "smooth", block: "start" });
  scroll();

  if (typeof ResizeObserver === "undefined") return true;

  let corrected = false;
  const ro = new ResizeObserver(() => {
    if (corrected) return;
    corrected = true;
    // Let the new layout paint before re-measuring the target's position.
    requestAnimationFrame(scroll);
  });
  ro.observe(document.body);
  // Streaming has had plenty of time to settle by then — stop watching
  // rather than reacting to unrelated resizes for the rest of the visit.
  setTimeout(() => ro.disconnect(), 4000);

  return true;
}
