import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = false, leftIcon, rightIcon, className = '', ...props }, ref) => {
    return (
      <div className={`mb-4 ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label className="block text-neutral-700 text-sm font-medium mb-1">{label}</label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              block 
              ${fullWidth ? 'w-full' : ''}
              ${leftIcon ? 'pl-10' : 'pl-4'}
              ${rightIcon ? 'pr-10' : 'pr-4'}
              py-2
              bg-white
              border
              ${error ? 'border-error-500' : 'border-neutral-300'}
              focus:border-primary
              focus:ring-1
              focus:ring-primary
              text-neutral-700
              rounded-md
              shadow-sm
              outline-none
              transition-colors
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-error-500 text-sm">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;