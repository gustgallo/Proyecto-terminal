import React from 'react';

interface LaserButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

export const LaserButton: React.FC<LaserButtonProps> = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const baseStyles =
    'relative overflow-hidden group inline-flex items-center justify-center font-bold transition-all duration-300 rounded-xl';

  const variants = {
    primary:
      'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-7 py-3.5 text-sm shadow-xl shadow-blue-600/25 active:scale-[0.98]',
    secondary:
      'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-6 py-3.5 text-sm active:scale-[0.98]',
    outline:
      'bg-transparent border-2 border-blue-500/80 hover:bg-blue-600/10 text-blue-400 px-6 py-3.5 text-sm active:scale-[0.98]',
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {/* Laser Beam Horizontal Sweep Effect */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none opacity-80" />
      
      {/* Subtle Glow Trail */}
      <span className="absolute inset-x-0 bottom-0 h-[2px] bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_8px_#22d3ee]" />

      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
};
