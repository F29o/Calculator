
import React from 'react';

interface ButtonProps {
  label: string | React.ReactNode;
  onClick: () => void;
  className?: string;
  variant?: 'number' | 'operator' | 'function' | 'action' | 'equal' | 'danger';
}

const Button: React.FC<ButtonProps> = ({ label, onClick, className = '', variant = 'number' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'number':
        return 'bg-slate-800 hover:bg-slate-700 text-slate-100';
      case 'operator':
        return 'bg-indigo-600 hover:bg-indigo-500 text-white font-bold';
      case 'function':
        return 'bg-slate-700 hover:bg-slate-600 text-indigo-300 font-medium text-sm';
      case 'action':
        return 'bg-slate-600 hover:bg-slate-500 text-slate-100';
      case 'equal':
        return 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold col-span-1';
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-500 text-white';
      default:
        return 'bg-slate-800 hover:bg-slate-700 text-white';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`p-3 md:p-4 rounded-xl transition-all duration-200 active:scale-95 shadow-lg flex items-center justify-center ${getVariantStyles()} ${className}`}
    >
      {label}
    </button>
  );
};

export default Button;
