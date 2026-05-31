import React from 'react';
import { Sparkles, ArrowLeft, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- Coming Soon ---
export const ComingSoon: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle = "We're building something extraordinary." }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-[80vh] flex items-center justify-center relative overflow-hidden w-full">
      {/* Background Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>

      <div className="relative z-10 text-center p-12 max-w-2xl mx-auto bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl hover:shadow-primary-500/10 transition-all duration-500">
        <div className="inline-flex p-5 rounded-3xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 mb-8 ring-1 ring-white/20 shadow-lg group">
          <Sparkles className="w-10 h-10 text-primary-300 group-hover:scale-110 transition-transform duration-500" />
        </div>

        <h2 className="text-5xl md:text-6xl font-bold text-white mb-2 font-heading tracking-tight">
          {title}
        </h2>
        <div className="text-3xl font-signature text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-300 mb-8">
          Coming Soon
        </div>

        <p className="text-gray-400 mb-10 text-lg leading-relaxed max-w-lg mx-auto font-light">
          {subtitle} <br />
          Our engineers are crafting a premium experience to redefine your workflow.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-medium border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 group border-none ring-1 ring-white/10" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back Home
          </button>
          <button className="px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 text-white rounded-2xl font-medium shadow-xl shadow-primary-500/20 flex items-center gap-2 group transform hover:-translate-y-0.5 transition-all">
            <Bell className="w-4 h-4 group-hover:swing" /> Notify Me
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  as?: React.ElementType;
}

export const Button: React.FC<ButtonProps> = ({
  children, variant = 'primary', size = 'md', className = '', as: Component = 'button', ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]";

  const variants = {
    primary: "bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white focus:ring-primary-500 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40",
    secondary: "bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-400 hover:to-secondary-500 text-white focus:ring-secondary-500 shadow-lg shadow-secondary-500/25 hover:shadow-secondary-500/40",
    outline: "border-2 border-primary-500/50 text-primary-400 hover:bg-primary-500/10 hover:border-primary-400 backdrop-blur-sm",
    ghost: "text-gray-300 hover:bg-white/5 hover:text-white backdrop-blur-sm",
    danger: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white focus:ring-red-500 shadow-lg shadow-red-500/25"
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base"
  };

  return (
    <Component
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white/10 dark:bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-white/10 p-6 ${className}`}>
    {children}
  </div>
);

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-200 mb-2">{label}</label>}
    <input
      className={`w-full bg-white/10 dark:bg-white/5 backdrop-blur-md border-2 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-white placeholder-gray-400 ${error ? 'border-red-500' : 'border-white/20 hover:border-white/30'} ${props.type !== 'file' ? 'px-4 py-3' : ''} ${className}`}
      {...props}
    />
    {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
  </div>
);

// --- Badge ---
export const Badge: React.FC<{ children: React.ReactNode; color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'cyan'; className?: string }> = ({ children, color = 'purple', className = '' }) => {
  const colors = {
    blue: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
    green: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    yellow: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
    red: "bg-red-500/20 text-red-300 border border-red-500/30",
    purple: "bg-primary-500/20 text-primary-300 border border-primary-500/30",
    cyan: "bg-secondary-500/20 text-secondary-300 border border-secondary-500/30",
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${colors[color]} ${className}`}>
      {children}
    </span>
  );
};