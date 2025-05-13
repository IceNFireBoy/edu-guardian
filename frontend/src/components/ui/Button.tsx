import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  // Optionally add specific variants or sizes if needed
  // variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  // size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  className = '', 
  disabled, 
  onClick, 
  type = 'button', // Default type to button
  ...props 
}) => {

  // Base button styles
  const baseStyles = 'btn'; // Assumes a base .btn class is defined in CSS

  // Example: Combine base styles with provided className and disabled styles
  // You might enhance this logic to handle variants/sizes if added
  const combinedClassName = `
    ${baseStyles} 
    ${className} 
    ${disabled ? 'btn-disabled' : ''} 
  `.trim().replace(/\s+/g, ' '); // Clean up extra whitespace

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled} 
      className={combinedClassName}
      {...props} // Spread remaining props (like aria-label, etc.)
    >
      {children}
    </button>
  );
};

export default Button; 