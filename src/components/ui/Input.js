import React from 'react';

export const Input = React.forwardRef(({ icon: Icon, className = '', ...props }, ref) => {
  return (
    <div className="relative w-full">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sapphire-700">
          <Icon className="w-5 h-5 text-cyan-dark opacity-70" />
        </div>
      )}
      <input
        ref={ref}
        className={`w-full py-3 ${Icon ? 'pl-12' : 'pl-4'} pr-4 rounded-2xl glass-input text-foreground placeholder:text-sapphire-700 bg-sapphire-800/40 ${className}`}
        {...props}
      />
    </div>
  );
});

Input.displayName = 'Input';
