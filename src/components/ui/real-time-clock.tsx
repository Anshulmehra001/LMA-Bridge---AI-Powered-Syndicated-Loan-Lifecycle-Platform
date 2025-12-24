'use client';

import { useState, useEffect } from 'react';
import { Clock, Globe } from 'lucide-react';

interface RealTimeClockProps {
  showDate?: boolean;
  showIcon?: boolean;
  format?: 'full' | 'time-only' | 'date-only';
  timezone?: 'local' | 'utc';
  className?: string;
  updateInterval?: number; // in milliseconds
}

function RealTimeClockComponent({ 
  showDate = true, 
  showIcon = false, 
  format = 'full',
  timezone = 'local',
  className = '',
  updateInterval = 1000 
}: RealTimeClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, updateInterval);

    return () => clearInterval(timer);
  }, [updateInterval]);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showIcon && <Clock className="w-4 h-4" />}
        <span className="font-mono">
          {timezone === 'utc' ? '--/--/---- --:--:-- UTC' : '--/--/---- --:--:--'}
        </span>
      </div>
    );
  }

  const formatTime = () => {
    const timeOptions: Intl.DateTimeFormatOptions = {
      timeZone: timezone === 'utc' ? 'UTC' : undefined,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };

    const dateOptions: Intl.DateTimeFormatOptions = {
      timeZone: timezone === 'utc' ? 'UTC' : undefined,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };

    switch (format) {
      case 'time-only':
        return currentTime.toLocaleTimeString('en-GB', timeOptions);
      case 'date-only':
        return currentTime.toLocaleDateString('en-GB', dateOptions);
      case 'full':
      default:
        const date = currentTime.toLocaleDateString('en-GB', dateOptions);
        const time = currentTime.toLocaleTimeString('en-GB', timeOptions);
        return showDate ? `${date} ${time}` : time;
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showIcon && <Clock className="w-4 h-4" />}
      <span className="font-mono">
        {formatTime()}
      </span>
      {timezone === 'utc' && (
        <span className="text-xs opacity-75">UTC</span>
      )}
    </div>
  );
}

// Export the component with proper SSR handling
export function RealTimeClock(props: RealTimeClockProps) {
  return <RealTimeClockComponent {...props} />;
}

// Specialized components for common use cases
export function HeaderClock({ className = '' }: { className?: string }) {
  return (
    <div className={`text-right bg-slate-800/50 rounded-lg px-4 py-2 border border-slate-700 ${className}`}>
      <p className="text-xs text-slate-400 flex items-center space-x-1">
        <Globe className="w-3 h-3" />
        <span>System Time (UTC)</span>
      </p>
      <RealTimeClock 
        showDate={true}
        format="full"
        timezone="utc"
        className="text-sm text-slate-200"
      />
    </div>
  );
}

export function MarketClock({ className = '' }: { className?: string }) {
  return (
    <RealTimeClock 
      showIcon={true}
      format="time-only"
      timezone="utc"
      className={`text-sm text-slate-600 ${className}`}
      updateInterval={1000}
    />
  );
}

export function TradingClock({ className = '' }: { className?: string }) {
  return (
    <RealTimeClock 
      showDate={false}
      format="time-only"
      timezone="utc"
      className={`text-xs text-slate-500 ${className}`}
      updateInterval={1000}
    />
  );
}