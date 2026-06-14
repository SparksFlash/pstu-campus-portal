import React from 'react';

const colorMap = {
  primary:   { bg: 'bg-primary-50',   text: 'text-primary-600',   icon: 'bg-primary-100' },
  secondary: { bg: 'bg-secondary-50', text: 'text-secondary-600', icon: 'bg-secondary-100' },
  success:   { bg: 'bg-green-50',     text: 'text-green-600',     icon: 'bg-green-100' },
  warning:   { bg: 'bg-amber-50',     text: 'text-amber-600',     icon: 'bg-amber-100' },
  error:     { bg: 'bg-red-50',       text: 'text-red-600',       icon: 'bg-red-100' },
  neutral:   { bg: 'bg-gray-50',      text: 'text-gray-600',      icon: 'bg-gray-100' },
};

export const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 bg-gray-200 rounded w-24" />
      <div className="h-10 w-10 bg-gray-200 rounded-lg" />
    </div>
    <div className="h-8 bg-gray-200 rounded w-16 mb-1" />
    <div className="h-3 bg-gray-100 rounded w-20" />
  </div>
);

const StatCard = ({ label, value, icon: Icon, color = 'primary', sublabel }) => {
  const c = colorMap[color] || colorMap.primary;
  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {Icon && (
          <div className={`${c.icon} p-2.5 rounded-lg`}>
            <Icon size={20} className={c.text} />
          </div>
        )}
      </div>
      <p className={`text-3xl font-bold ${c.text}`}>{value ?? '—'}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
    </div>
  );
};

export { StatCard };
export default StatCard;
