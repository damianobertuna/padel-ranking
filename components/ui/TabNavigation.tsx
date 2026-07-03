'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface Tab {
  key: string;
  label: string;
  badge?: string | number | null;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
}

export default function TabNavigation({ tabs, activeTab }: TabNavigationProps) {
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Stop loading state when the active tab finally matches the clicked tab
  const prevTabRef = useRef(activeTab);
  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      setNavigating(false);
    }
    prevTabRef.current = activeTab;
  }, [activeTab]);

  const handleTabClick = useCallback((tabKey: string) => {
    if (tabKey === activeTab) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabKey);
    params.set('page', '1');
    params.set('playerPage', '1');

    setNavigating(true);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [activeTab, searchParams, pathname, router]);

  return (
    <div className="relative">
      {navigating && (
        <div className="absolute -top-1 left-0 right-0 h-1 z-10 overflow-hidden rounded-full">
          <div className="h-full w-full bg-blue-100">
            <div className="h-full bg-blue-600 animate-loading-bar" />
          </div>
        </div>
      )}

      <div className="flex w-full mb-6 border-b border-slate-300">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              disabled={navigating && isActive}
              className={`
                flex-1 text-center py-3 text-sm font-black uppercase tracking-wider transition-all duration-200 relative
                ${isActive 
                  ? 'border-b-4 border-blue-600 text-slate-900' 
                  : 'text-slate-500 hover:text-slate-900 border-b-4 border-transparent'
                }
                ${navigating && !isActive ? 'opacity-50 cursor-wait' : ''}
                ${isActive ? 'cursor-default' : 'cursor-pointer hover:bg-slate-100/50'}
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
              {tab.badge != null && (
                <span className="ml-1.5 opacity-70 text-[10px]">({tab.badge})</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
