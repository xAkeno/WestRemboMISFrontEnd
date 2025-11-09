import { ReactNode } from "react";

interface FormSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export const FrontFromSection = ({ title, children, className = "" }: FormSectionProps) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <h3 className="text-sm font-semibold text-form-label uppercase tracking-wide border-b border-form-border pb-2">
          {title}
        </h3>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
};
