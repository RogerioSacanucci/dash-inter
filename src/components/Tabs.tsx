// src/components/Tabs.tsx

interface Tab {
  key: string;
  label: string;
  adminOnly?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  isAdmin: boolean;
}

export type { Tab };

export default function Tabs({ tabs, active, onChange, isAdmin }: TabsProps) {
  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div role="tablist" className="flex gap-1 border-b border-white/[0.06] mb-6">
      {visibleTabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0 ${
            active === tab.key
              ? 'text-white border-brand'
              : 'text-white/35 border-transparent hover:text-white/60'
          }`}
        >
          <span className="flex items-center gap-2">
            {tab.label}
            {tab.adminOnly && (
              <span className="bg-brand/15 text-brand text-[10px] font-semibold px-2 py-0.5 rounded-full">
                admin
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
