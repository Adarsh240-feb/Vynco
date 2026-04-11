import React from 'react';

export const Button = React.forwardRef(({ children, className = '', variant = 'primary', ...props }, ref) => {
  const baseStyles = 'w-full py-3 px-6 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-cyan-dark hover:bg-cyan-neon text-white shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:shadow-[0_0_25px_rgba(0,229,255,0.5)]',
    secondary: 'bg-sapphire-700 hover:bg-sapphire-800 text-white border border-white/10',
    outline: 'bg-transparent border border-cyan-dark text-cyan-neon hover:bg-cyan-dark/10'
  };

  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
