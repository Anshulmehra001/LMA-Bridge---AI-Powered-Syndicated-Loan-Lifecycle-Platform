'use client';

import dynamic from 'next/dynamic';
import { Globe } from 'lucide-react';

// Dynamically import the clock components to avoid SSR hydration issues
const RealTimeClock = dynamic(() => import('./real-time-clock').then(mod => ({ default: mod.RealTimeClock })), {
  ssr: false,
  loading: () => (
    <span className="font-mono text-slate-400">
      Loading...
    </span>
  )
});

const MarketClock = dynamic(() => import('./real-time-clock').then(mod => ({ default: mod.MarketClock })), {
  ssr: false,
  loading: () => (
    <span className="font-mono text-slate-400 text-sm">
      --:--:--
    </span>
  )
});

const TradingClock = dynamic(() => import('./real-time-clock').then(mod => ({ default: mod.TradingClock })), {
  ssr: false,
  loading: () => (
    <span className="font-mono text-slate-400 text-xs">
      --:--:--
    </span>
  )
});

// Header clock with proper SSR handling
export function HeaderClock({ className = '' }: { className?: string }) {
  return (
    <div className={`text-right bg-slate-800/50 rounded-lg px-4 py-2 border border-slate-700 ${className}`}>
      <p className="text-xs text-slate-400 flex items-center space-x-1">
        <Globe className="w-3 h-3" />
        <span>System Time (UTC)</span>
      </p>
      <div className="text-sm text-slate-200">
        <RealTimeClock 
          showDate={true}
          format="full"
          timezone="utc"
          className="text-sm text-slate-200"
        />
      </div>
    </div>
  );
}

// Export the dynamic components
export { RealTimeClock, MarketClock, TradingClock };