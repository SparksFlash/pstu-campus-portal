import React from 'react';

export const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <p className="mt-4 text-xl font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
};

export default Loading;
