import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  id: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  children?: ReactNode;
}

export const FormField = ({ 
  label, 
  id, 
  type = "text", 
  required = false, 
  placeholder,
  children 
}: FormFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-form-label">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children || (
        <Input
          id={id}
          name={id}
          type={type}
          required={required}
          placeholder={placeholder}
          className="border-form-border focus:ring-primary"
        />
      )}
    </div>
  );
};
