import React from 'react';

interface StarRatingProps {
  satisfaction: number;
  size?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ satisfaction, size = 24 }) => {

  const normalizedSatisfaction = Math.max(-100, Math.min(100, satisfaction));
  const starRating = (normalizedSatisfaction + 100) / 40; // Maps -100..100 to 0..5

  const renderStar = (index: number) => {
    const fillPercentage = Math.max(0, Math.min(1, starRating - index));
    
    return (
      <div key={index} className="relative inline-block" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          className="absolute top-0 left-0 text-gray-400"
          fill="currentColor"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <div 
          className="absolute top-0 left-0 overflow-hidden"
          style={{ width: `${fillPercentage * 100}%` }}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className="text-yellow-400"
            fill="currentColor"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center space-x-1">
      {[0, 1, 2, 3, 4].map(renderStar)}
    </div>
  );
};

export default StarRating;
