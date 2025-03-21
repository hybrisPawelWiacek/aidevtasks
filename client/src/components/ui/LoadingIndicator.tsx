import React from "react";

interface LoadingIndicatorProps {
  isFullscreen?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ isFullscreen = false }) => {
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 z-40 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-8">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};
