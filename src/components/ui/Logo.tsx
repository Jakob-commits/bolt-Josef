import SalesSenseiLogo from '../../assets/sales-sensei-logo.svg';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
  xl: 'h-20 w-20',
};

export function Logo({ size = 'md', className = '', showText = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={SalesSenseiLogo}
        alt="Sales Sensei Logo"
        className={`${sizeClasses[size]} flex-shrink-0`}
      />
      {showText && (
        <span className="text-lg font-bold text-gray-900">Sales Sensei</span>
      )}
    </div>
  );
}
