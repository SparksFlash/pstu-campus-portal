import React from 'react';

const colorMap = {
  primary:   { text: 'text-primary-600',   icon: 'bg-gradient-to-br from-primary-400 to-primary-600'    },
  secondary: { text: 'text-secondary-600', icon: 'bg-gradient-to-br from-secondary-400 to-secondary-600' },
  success:   { text: 'text-green-600',     icon: 'bg-gradient-to-br from-green-400 to-green-600'         },
  warning:   { text: 'text-amber-600',     icon: 'bg-gradient-to-br from-amber-400 to-amber-500'         },
  error:     { text: 'text-red-600',       icon: 'bg-gradient-to-br from-red-400 to-red-600'             },
  neutral:   { text: 'text-gray-600',      icon: 'bg-gradient-to-br from-gray-400 to-gray-600'           },
};

export const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 bg-gray-200 rounded w-24" />
      <div className="h-10 w-10 bg-gray-200 rounded-xl" />
    </div>
    <div className="h-8 bg-gray-200 rounded w-16 mb-1" />
    <div className="h-3 bg-gray-100 rounded w-20" />
  </div>
);

const StatCard = ({ label, value, icon: Icon, color = 'primary', sublabel }) => {
  const c = colorMap[color] || colorMap.primary;
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {Icon && (
          <div className={`${c.icon} p-2.5 rounded-xl shadow-sm`}>
            <Icon size={20} className="text-white" />
          </div>
        )}
      </div>
      <p className={`text-3xl font-black ${c.text}`}>{value ?? '—'}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
    </div>
  );
};

export { StatCard };
export default StatCard;
