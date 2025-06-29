import React from 'react';
import { Icon as IconifyIcon } from '@iconify/react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}

const Icon: React.FC<IconProps> = ({ name, size = 24, className = '', onClick }) => {
  return (
    <IconifyIcon 
      icon={`solar:${name}`} 
      width={size} 
      height={size} 
      className={className}
      onClick={onClick}
    />
  );
};

export default Icon;