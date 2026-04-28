import { useState, useEffect, useRef, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onValueChange?: (value: string) => void;
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ value = "", onValueChange, className, type, ...props }, ref) => {
    const [showValue, setShowValue] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const timerRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
      // Auto-hide after 3 seconds when showing via eye icon
      if (showValue && !isFocused) {
        timerRef.current = setTimeout(() => {
          setShowValue(false);
        }, 3000);
      }

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }, [showValue, isFocused]);

    const maskValue = (val: string): string => {
      if (!val || val.length === 0) return "";
      if (val.length === 1) return val;
      if (val.length === 2) return val;
      if (val.length === 3) return val;
      
      // Show first, second, and last character
      const first = val[0];
      const second = val[1];
      const last = val[val.length - 1];
      const middleLength = val.length - 3;
      const masked = "•".repeat(middleLength);
      
      return `${first}${second}${masked}${last}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onValueChange?.(newValue);
    };

    const handleFocus = () => {
      setIsFocused(true);
      // Clear the auto-hide timer when input is focused
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };

    const handleBlur = () => {
      setIsFocused(false);
      // If eye icon was used, restart the timer
      if (showValue) {
        timerRef.current = setTimeout(() => {
          setShowValue(false);
        }, 3000);
      }
    };

    const toggleVisibility = () => {
      const newShowValue = !showValue;
      setShowValue(newShowValue);
      
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // Start new timer if showing and not focused
      if (newShowValue && !isFocused) {
        timerRef.current = setTimeout(() => {
          setShowValue(false);
        }, 3000);
      }
    };

    // Show actual value when:
    // 1. Input is focused (typing)
    // 2. Eye icon is clicked to show
    // 3. It's a date input (dates shouldn't be masked)
    const shouldShowActualValue = isFocused || showValue || type === 'date';
    const displayValue = shouldShowActualValue ? value : maskValue(value);

    return (
      <div className="relative">
        <Input
          ref={ref}
          {...props}
          type={type}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn("pr-10", className)}
        />
        {type !== 'date' && (
          <button
            type="button"
            onClick={toggleVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
            aria-label={showValue ? "Hide value" : "Show value"}
          >
            {showValue ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    );
  }
);

MaskedInput.displayName = "MaskedInput";
