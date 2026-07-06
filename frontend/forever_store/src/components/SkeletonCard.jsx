import React from "react";

const SkeletonCard = ({ count = 5 }) => {
  // Generate an array of skeleton cards based on count
  const skeletons = Array.from({ length: count }, (_, index) => (
    <div
      key={`skeleton-${index}`}
      className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden animate-pulse flex flex-col h-full"
    >
      {/* Image placeholder - matches Card component aspect ratio */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100" />

      {/* Content placeholder - matches Card component padding and layout */}
      <div className="p-3 flex flex-col flex-grow space-y-2">
        {/* Product name placeholder - line clamp 1 */}
        <div className="h-3 bg-gray-200 rounded w-4/5 animate-pulse" />

        {/* Price placeholder */}
        <div className="h-4 bg-gray-200 rounded w-2/5 mt-auto animate-pulse" />
      </div>
    </div>
  ));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {skeletons}
    </div>
  );
};

export default SkeletonCard;
