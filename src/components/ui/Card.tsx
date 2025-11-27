import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  active?: boolean;
}

export function Card({
  children,
  className = "",
  hover = false,
  active = true,
}: CardProps) {
  const baseStyles = active
    ? "bg-white"
    : "bg-gray-100 opacity-80 cursor-not-allowed pointer-events-none";

  const hoverStyles =
    hover && active
      ? "hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
      : "";

  return (
    <div
      className={`${baseStyles} rounded-2xl shadow-sm border border-cyan-100 p-6 ${hoverStyles} ${className}`}
    >
      {children}
    </div>
  );
}

interface SimpleProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = "" }: SimpleProps) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }: SimpleProps) {
  return (
    <h3 className={`text-2xl font-semibold text-slate-900 mb-3 ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = "" }: SimpleProps) {
  return <div className={`text-sm ${className}`}>{children}</div>;
}
