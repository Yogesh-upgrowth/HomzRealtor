// CSS scroll-driven progress bar — no JS, no layout shift
// (_closing_structure.progress_affordance / page_furniture.reading_progress_bar).
// Uses the scroll-timeline CSS spec; browsers without support just don't
// animate the bar (it stays at 0 width), which is an acceptable no-op decay
// rather than broken layout.
const ReadingProgressBar = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-40 h-[3px] origin-left bg-[#B77D2B]"
      style={{
        animationName: "blog-reading-progress",
        animationTimeline: "scroll(root)" as never,
        animationFillMode: "forwards",
        transform: "scaleX(0)",
      }}
    />
  );
};

export default ReadingProgressBar;
