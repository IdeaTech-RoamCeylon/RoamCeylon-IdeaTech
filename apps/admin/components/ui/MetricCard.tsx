import React from 'react';

type ColorVariant = 'blue' | 'purple' | 'emerald' | 'rose' | 'orange' | 'yellow';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  colorVariant?: ColorVariant;
}

const colorStyles: Record<ColorVariant, { bg: string; text: string; trend: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', trend: 'text-emerald-600 dark:text-emerald-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', trend: 'text-emerald-600 dark:text-emerald-400' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', trend: 'text-emerald-600 dark:text-emerald-400' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400', trend: 'text-rose-600 dark:text-rose-400' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', trend: 'text-rose-600 dark:text-rose-400' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400', trend: 'text-emerald-600 dark:text-emerald-400' },
};

export function MetricCard({ title, value, icon, trend, colorVariant = 'blue' }: MetricCardProps) {
  const styles = colorStyles[colorVariant];
  
  return (
    <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
        <span className={`p-2 rounded-lg ${styles.bg} ${styles.text}`}>
          {icon}
        </span>
      </div>
      <p className="text-3xl font-semibold mt-4 text-zinc-900 dark:text-zinc-50">{value}</p>
      
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          <svg 
            className={`w-3 h-3 ${trend.value < 0 ? 'transform rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          <span>
            {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}
