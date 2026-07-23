type Tab = { id: string; label: string };

type Props = {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
};

// Presentational-only tab strip — generalizes the two-button styling that used
// to live in PersonaTabs.tsx to N segments. Each consumer owns its own active-tab
// state and panel-switching logic; this component just renders the row.
const SegmentedTabs = ({ tabs, active, onChange }: Props) => {
  if (tabs.length <= 1) return null;

  return (
    <div
      className="grid gap-2 mb-6"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          aria-pressed={active === tab.id}
          className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition cursor-pointer ${
            active === tab.id
              ? "border-transparent bg-gradient-to-r from-[#FDF094] to-[#B77D2B] text-black"
              : "border-gray-700 text-gray-300 hover:border-[#B77D2B] hover:text-[#B77D2B]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default SegmentedTabs;
