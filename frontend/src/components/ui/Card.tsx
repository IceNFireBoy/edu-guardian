import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  // Potentially add padding props, shadow variants, etc. later if needed
  // padding?: 'none' | 'sm' | 'md' | 'lg';
  // shadow?: 'sm' | 'md' | 'lg' | 'xl';
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  // Example: Destructure specific common HTML attributes or use ...props broadly
  ...props 
}) => {
  // Base card styles - adjust defaults as per project's design system
  const baseStyles = 'bg-white dark:bg-gray-800 rounded-lg shadow-md';
  // Default padding, can be overridden by className or specific props if added
  const paddingStyles = 'p-6'; 
  // Default margin, can also be overridden
  const marginStyles = 'my-4'; 

  const combinedClassName = `
    ${baseStyles} 
    ${paddingStyles} 
    ${marginStyles} 
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div 
      className={combinedClassName}
      {...props} // Spread remaining HTML attributes (id, data-testid, etc.)
    >
      {children}
    </div>
  );
};

export default Card; 