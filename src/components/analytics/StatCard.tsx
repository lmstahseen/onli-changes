import React from 'react';
import Icon from '../common/Icon';
import { Card, CardContent } from '../ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconColor?: string;
  iconBgColor?: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
  footer?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  iconColor = 'text-blue-600', 
  iconBgColor = 'bg-blue-100',
  change,
  footer
}) => {
  return (
    <Card className="shadow-soft hover:shadow-soft-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center`}>
            <Icon name={icon} size={24} className={iconColor} />
          </div>
          <div className="flex-1">
            <p className="text-gray-600 text-sm">{title}</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {change && (
                <span className={`text-sm font-medium ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {change.isPositive ? '+' : ''}{change.value}%
                </span>
              )}
            </div>
            {footer && (
              <p className="text-xs text-gray-500 mt-1">{footer}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;