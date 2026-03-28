import { useState, useRef, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type GlobalVisibility = "show" | "hide" | null;

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onValueChange?: (value: string) => void;
  /**
   * "show"  → global Show All button was pressed, reveal this field
   * "hide"  → global Hide All button was pressed, force-mask this field
   * null    → no global override, field controls itself locally
   */
  globalVisibility?: GlobalVisibility;
}

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ value = "", onValueChange, className, type, placeholder, globalVisibility = null, ...props }, ref) => {
    const [localShow, setLocalShow] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const timerRef = useRef<NodeJS.Timeout>();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange?.(e.target.value);
    };

    const handleFocus = () => {
      setIsFocused(true);
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    const handleBlur = () => {
      setIsFocused(false);
      if (localShow) {
        timerRef.current = setTimeout(() => setLocalShow(false), 3000);
      }
    };

    const toggleVisibility = () => {
      const next = !localShow;
      setLocalShow(next);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (next && !isFocused) {
        timerRef.current = setTimeout(() => setLocalShow(false), 3000);
      }
    };

    const isDate = type === 'date';

    const isRevealed =
    isDate ||
    isFocused ||                          // typing always reveals
    localShow ||                          // per-field eye always works
    (globalVisibility === "show" &&        // global show, unless globally hidden
    globalVisibility !== "hide");                  // default: local control

    const masked = !isRevealed;

    return (
      <div className="relative">
        {/* pass real value */}
        <Input
          ref={ref}
          {...props}
          type={type}
          value={value}
          placeholder={masked ? undefined : placeholder}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            "pr-10",
            masked && value.length > 0 && "text-transparent caret-foreground selection:text-transparent",
            className
          )}
        />

        
        {masked && value.length > 0 && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center px-3 pr-10"
            aria-hidden="true"
          >
            <span className="tracking-widest text-foreground text-sm leading-none">
              {"•".repeat(value.length)}
            </span>
          </div>
        )}

        {masked && value.length === 0 && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center px-3 pr-10"
            aria-hidden="true"
          >
            <span className="text-muted-foreground text-sm">{placeholder}</span>
          </div>
        )}

        {!isDate && (
          <button
            type="button"
            onClick={toggleVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
            aria-label={isRevealed ? "Hide value" : "Show value"}
          >
            {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    );
  }
);

MaskedInput.displayName = "MaskedInput";