import React from 'react';

const colorMap = {
  primary:   { text: 'text-primary-700 dark:text-primary-400',   icon: 'bg-primary-100 dark:bg-primary-900/30',   iconText: 'text-primary-600 dark:text-primary-400'   },
  secondary: { text: 'text-secondary-700 dark:text-secondary-400', icon: 'bg-secondary-100 dark:bg-secondary-900/30', iconText: 'text-secondary-600 dark:text-secondary-400' },
  success:   { text: 'text-green-700 dark:text-green-400',   icon: 'bg-green-100 dark:bg-green-900/30',   iconText: 'text-green-600 dark:text-green-400'   },
  warning:   { text: 'text-amber-700 dark:text-amber-400',   icon: 'bg-amber-100 dark:bg-amber-900/30',   iconText: 'text-amber-600 dark:text-amber-400'   },
  error:     { text: 'text-red-700 dark:text-red-400',       icon: 'bg-red-100 dark:bg-red-900/30',       iconText: 'text-red-600 dark:text-red-400'       },
  neutral:   { text: 'text-gray-700 dark:text-gray-300',     icon: 'bg-gray-100 dark:bg-gray-700',        iconText: 'text-gray-500 dark:text-gray-400'     },
  blue:      { text: 'text-blue-700 dark:text-blue-400',     icon: 'bg-blue-100 dark:bg-blue-900/30',     iconText: 'text-blue-600 dark:text-blue-400'     },
  purple:    { text: 'text-purple-700 dark:text-purple-400', icon: 'bg-purple-100 dark:bg-purple-900/30', iconText: 'text-purple-600 dark:text-purple-400' },
  teal:      { text: 'text-teal-700 dark:text-teal-400',     icon: 'bg-teal-100 dark:bg-teal-900/30',     iconText: 'text-teal-600 dark:text-teal-400'     },
  yellow:    { text: 'text-yellow-700 dark:text-yellow-400', icon: 'bg-yellow-100 dark:bg-yellow-900/30', iconText: 'text-yellow-600 dark:text-yellow-400' },
};

export const StatCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
      <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
    </div>
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
    <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-20" />
  </div>
);

const StatCard = ({ label, value, icon: Icon, color = 'primary', sublabel }) => {
  const c = colorMap[color] || colorMap.primary;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700
      hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-none pt-0.5">
          {label}
        </p>
        {Icon && (
          <div className={`${c.icon} p-2.5 rounded-xl flex-shrink-0`}>
            <Icon size={18} className={c.iconText} />
          </div>
        )}
      </div>
      <p className={`text-3xl font-black tabular-nums ${c.text}`}>{value ?? '—'}</p>
      {sublabel && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{sublabel}</p>}
    </div>
  );
};

export { StatCard };
export default StatCard;
