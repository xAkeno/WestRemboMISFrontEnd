/**
 * LguFormPrimitives.tsx
 * Shared building blocks for all LGU application forms.
 * Import what you need from this file in each form component.
 */

export const NAVY = "#0f2a5e";
export const PINK = "#c2467d";

// ─── Field Label ───────────────────────────────────────────────────────────────
// Shows a red * for required, or a gray "(optional)" badge for nullable fields.
export const FieldLabel = ({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <label
    htmlFor={htmlFor}
    className="block text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5 select-none"
    style={{ color: PINK }}
  >
    {children}
    {required ? (
      <span className="ml-1 font-black" style={{ color: "#ef4444" }}>*</span>
    ) : (
      <span
        className="ml-1.5 font-normal normal-case tracking-normal px-1 py-0.5 rounded"
        style={{ color: "#9ca3af", fontSize: 9, backgroundColor: "#f3f4f6", letterSpacing: 0 }}
      >
        optional
      </span>
    )}
  </label>
);

// ─── Underline Input ──────────────────────────────────────────────────────────
export const FieldInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full bg-transparent border-0 border-b py-2 text-sm text-foreground placeholder-gray-400 focus:outline-none transition-colors duration-200 ${props.className ?? ""}`}
    style={{ borderBottomWidth: 1, borderColor: "#d1d5db", ...props.style }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = PINK;
      props.onFocus?.(e);
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = props.disabled ? "#e5e7eb" : "#d1d5db";
      props.onBlur?.(e);
    }}
  />
);

// ─── Underline Textarea ───────────────────────────────────────────────────────
export const FieldTextarea = (
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) => (
  <textarea
    {...props}
    className={`w-full bg-transparent border-0 border-b py-2 text-sm text-foreground placeholder-gray-400 focus:outline-none transition-colors duration-200 resize-none ${props.className ?? ""}`}
    style={{ borderBottomWidth: 1, borderColor: "#d1d5db", ...props.style }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = PINK;
      props.onFocus?.(e);
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = "#d1d5db";
      props.onBlur?.(e);
    }}
  />
);

// ─── Section Divider ──────────────────────────────────────────────────────────
export const SectionDivider = ({ title }: { title: string }) => (
  <div className="flex items-center gap-3 my-1">
    <div style={{ width: 3, height: 14, backgroundColor: PINK, borderRadius: 1, flexShrink: 0 }} />
    <p
      className="text-[10px] font-black uppercase tracking-[0.18em] whitespace-nowrap"
      style={{ color: NAVY }}
    >
      {title}
    </p>
    <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
  </div>
);

// ─── Review Row ───────────────────────────────────────────────────────────────
export const ReviewRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex gap-3 py-1.5" style={{ borderBottom: "1px solid #f0f4f8" }}>
    <span
      className="text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
      style={{ color: PINK, minWidth: 140 }}
    >
      {label}
    </span>
    <span className="text-sm text-foreground break-words">
      {value?.trim() ? value : <span className="text-gray-400 italic text-xs">Not specified</span>}
    </span>
  </div>
);

// ─── Review Card ──────────────────────────────────────────────────────────────
export const ReviewCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div
    className="p-4"
    style={{
      backgroundColor: "#f8faff",
      borderRadius: 2,
      border: "1px solid #dde3ed",
      borderLeftWidth: 2,
      borderLeftColor: NAVY,
    }}
  >
    <p
      className="text-[10px] font-black uppercase tracking-[0.18em] mb-3"
      style={{ color: NAVY }}
    >
      {title}
    </p>
    {children}
  </div>
);

// ─── Review Header ────────────────────────────────────────────────────────────
export const ReviewHeader = ({
  current,
  total,
}: {
  current: number;
  total: number;
}) => (
  <div className="text-center mb-6">
    <p
      className="text-[10px] font-bold uppercase tracking-[0.20em] mb-1"
      style={{ color: PINK }}
    >
      Step {current} of {total}
    </p>
    <h3
      className="text-xl font-bold text-foreground"
      style={{ fontFamily: "'Georgia', serif" }}
    >
      Review Your Information
    </h3>
    <div
      style={{ width: 40, height: 2, backgroundColor: PINK, margin: "8px auto 0" }}
    />
  </div>
);

// ─── Form Card Wrapper ────────────────────────────────────────────────────────
export const FormCard = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div
    className="bg-card border border-border overflow-hidden"
    style={{ borderRadius: 2, borderTopWidth: 3, borderTopColor: PINK }}
  >
    <div
      className="px-6 sm:px-8 pt-6 pb-4"
      style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f8faff" }}
    >
      {subtitle && (
        <p
          className="text-[10px] font-bold uppercase tracking-[0.16em] mb-0.5"
          style={{ color: NAVY }}
        >
          {subtitle}
        </p>
      )}
      <h2
        className="text-lg font-bold text-foreground"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        {title}
      </h2>
    </div>
    <div className="px-6 sm:px-8 py-6">{children}</div>
  </div>
);

// ─── Underline-style Select Trigger styles ────────────────────────────────────
// Pass these to shadcn SelectTrigger className + style
export const selectTriggerStyle = {
  className: "border-0 border-b rounded-none focus:ring-0 focus:ring-offset-0 text-sm px-0 h-9 bg-transparent shadow-none",
  style: { borderBottomWidth: 1, borderColor: "#d1d5db", borderRadius: 0 },
};
