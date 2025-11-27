import { useState, useRef } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
  title?: string;
}

export function InfoTooltip({ content, title }: InfoTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('bottom');
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);

    // Check if tooltip would overflow bottom of viewport
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // If not enough space below (less than 300px) and more space above, show on top
      if (spaceBelow < 300 && spaceAbove > spaceBelow) {
        setTooltipPosition('top');
      } else {
        setTooltipPosition('bottom');
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div className="relative inline-block" ref={tooltipRef}>
      <button
        ref={buttonRef}
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-cyan-100 text-cyan-600 hover:bg-cyan-200 transition-colors cursor-help"
        aria-label="Weitere Informationen"
      >
        <Info className="w-3 h-3" />
      </button>

      {isHovered && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 ${
            tooltipPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          } w-64 bg-gray-900 text-white rounded-lg shadow-xl p-3 z-[100] animate-fadeIn pointer-events-none`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Arrow */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 ${
              tooltipPosition === 'top' ? 'bottom-[-4px]' : 'top-[-4px]'
            }`}
          />

          {title && (
            <h4 className="font-semibold text-white mb-1.5 text-sm">{title}</h4>
          )}
          <p className="text-sm text-gray-100 leading-relaxed">{content}</p>
        </div>
      )}
    </div>
  );
}
