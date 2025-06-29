import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressBarProps {
  value: number;
  maxValue: number;
  label?: string;
  color?: string;
  height?: number;
  showPercentage?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  maxValue, 
  label, 
  color = '#2727E6', 
  height = 8,
  showPercentage = true,
  className
}) => {
  const percentage = Math.min(Math.round((value / maxValue) * 100), 100);
  
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">{label}</span>
          {showPercentage && (
            <span className="text-sm font-medium text-gray-900">{percentage}%</span>
          )}
        </div>
      )}
      <div 
        className="w-full bg-gray-100 rounded-full overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <div 
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color
          }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;