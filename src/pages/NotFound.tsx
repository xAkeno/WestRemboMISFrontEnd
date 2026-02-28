import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileX } from "lucide-react";

const NAVY = "#0f2a5e";
const PINK  = "#c2467d";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--background, #f8faff)" }}
    >
      {/* Subtle diagonal stripe texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #0f2a5e 0, #0f2a5e 1px, transparent 0, transparent 50%)",
          backgroundSize: "12px 12px",
        }}
      />

      <div className="relative text-center max-w-md w-full">

        {/* Top accent bar */}
        <div
          className="mx-auto mb-8"
          style={{ width: 3, height: 48, backgroundColor: PINK, borderRadius: 1 }}
        />

        {/* Icon */}
        <div
          className="w-20 h-20 flex items-center justify-center mx-auto mb-6"
          style={{
            backgroundColor: "#f0f4ff",
            border: `2px solid #c8d5f0`,
            borderRadius: 2,
          }}
        >
          <FileX className="w-10 h-10" style={{ color: NAVY }} />
        </div>

        {/* 404 number */}
        <p
          className="font-black mb-2 leading-none"
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: "clamp(5rem, 18vw, 7rem)",
            color: NAVY,
            opacity: 0.08,
            letterSpacing: "-0.04em",
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -68%)",
            userSelect: "none",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          404
        </p>

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-3 mb-3">
          <div style={{ width: 24, height: 1, backgroundColor: PINK }} />
          <p
            className="text-[10px] font-bold uppercase tracking-[0.20em]"
            style={{ color: PINK }}
          >
            Page Not Found
          </p>
          <div style={{ width: 24, height: 1, backgroundColor: PINK }} />
        </div>

        {/* Heading */}
        <h1
          className="font-bold text-foreground mb-3"
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: "clamp(1.4rem, 4vw, 1.9rem)",
          }}
        >
          This Page Does{" "}
          <span style={{ color: PINK }}>Not Exist</span>
        </h1>

        {/* Divider bar */}
        <div
          className="mx-auto mb-4"
          style={{ width: 48, height: 2, backgroundColor: PINK }}
        />

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          The page you're looking for may have been moved, deleted, or the
          URL may be incorrect. Please check the address or return to the
          homepage.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200"
            style={{
              color: "#6b7280",
              border: "1px solid #dde3ed",
              borderRadius: 1,
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = PINK;
              (e.currentTarget as HTMLElement).style.color = PINK;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#dde3ed";
              (e.currentTarget as HTMLElement).style.color = "#6b7280";
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>

          <button
            onClick={() => navigate("/home")}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all duration-200"
            style={{ backgroundColor: NAVY, borderRadius: 1 }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.backgroundColor = NAVY)
            }
          >
            Return to Homepage
          </button>
        </div>

        {/* Bottom accent */}
        <div
          className="mx-auto mt-10"
          style={{ width: 3, height: 24, backgroundColor: PINK, opacity: 0.4, borderRadius: 1 }}
        />
      </div>
    </div>
  );
}
