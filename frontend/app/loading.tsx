import React from "react";

const CircleLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
    </div>
  );
};

export default CircleLoader;
