import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, ShieldAlert, LogIn, UserPlus } from "lucide-react";

const NAVY = "#0f2a5e";
const PINK  = "#c2467d";

interface AuthRequiredModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /**
   * Short description of what the user was trying to do.
   * e.g. "access the Services page" or "submit a document request"
   */
  featureLabel?: string;
}

export default function AuthRequiredModal({
  open,
  onClose,
  featureLabel = "use this feature",
}: AuthRequiredModalProps) {
  const navigate   = useNavigate();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Trap body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const handleSignIn    = () => { onClose(); navigate("/login"); };
  const handleRegister  = () => { onClose(); navigate("/register"); };

  // Click outside overlay closes
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(10, 20, 60, 0.60)", backdropFilter: "blur(3px)" }}
      onClick={handleOverlayClick}
    >
      {/* Modal panel */}
      <div
        className="relative w-full max-w-sm bg-card border border-border overflow-hidden"
        style={{
          borderRadius: 2,
          borderTopWidth: 3,
          borderTopColor: PINK,
          boxShadow: "0 24px 64px rgba(10,20,60,0.28)",
          animation: "lgu-modal-in 0.18s ease-out",
        }}
      >
        {/* ── Header ── */}
        <div
          className="px-6 pt-6 pb-4"
          style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f8faff" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#fff0f5", border: `1.5px solid ${PINK}`, borderRadius: 1 }}
              >
                <ShieldAlert className="w-5 h-5" style={{ color: PINK }} />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 mb-0.5">
                  <div style={{ width: 12, height: 1, backgroundColor: PINK }} />
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: PINK }}>
                    Authentication Required
                  </p>
                </div>
                <h2
                  className="font-bold text-foreground"
                  style={{ fontFamily: "'Georgia', serif", fontSize: "1rem" }}
                >
                  Sign In to Continue
                </h2>
              </div>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center flex-shrink-0 transition-colors duration-200"
              style={{ color: "#9ca3af", borderRadius: 1 }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = NAVY}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "#9ca3af"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-5">
          {/* Message */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            You need a verified{" "}
            <span className="font-semibold text-foreground">Barangay West Rembo</span> account
            to {featureLabel}. Please sign in or create an account to proceed.
          </p>

          {/* Divider with label */}
          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#9ca3af" }}>
              Choose an option
            </p>
            <div className="flex-1 h-px" style={{ backgroundColor: "#e5e7eb" }} />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            {/* Sign In — primary */}
            <button
              onClick={handleSignIn}
              className="flex flex-col items-center gap-2 py-4 px-3 text-white transition-all duration-200"
              style={{ backgroundColor: NAVY, borderRadius: 1 }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = NAVY)
              }
            >
              <LogIn className="w-5 h-5" />
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-wider">Sign In</p>
                <p className="text-[10px] opacity-70 normal-case tracking-normal mt-0.5">
                  I have an account
                </p>
              </div>
            </button>

            {/* Register — secondary */}
            <button
              onClick={handleRegister}
              className="flex flex-col items-center gap-2 py-4 px-3 transition-all duration-200"
              style={{
                backgroundColor: "transparent",
                border: `1.5px solid ${PINK}`,
                color: PINK,
                borderRadius: 1,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "#fff0f5";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              }}
            >
              <UserPlus className="w-5 h-5" />
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-wider">Register</p>
                <p className="text-[10px] opacity-70 normal-case tracking-normal mt-0.5">
                  Create an account
                </p>
              </div>
            </button>
          </div>

          {/* Dismiss */}
          <button
            onClick={onClose}
            className="w-full text-center text-xs text-muted-foreground transition-colors duration-200 py-1"
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = NAVY}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = ""}
          >
            Maybe later
          </button>
        </div>
      </div>

      {/* Keyframe for modal entrance */}
      <style>{`
        @keyframes lgu-modal-in {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── HOW TO USE ───────────────────────────────────────────────────────────────
// 1. Import in any page/component:
//      import AuthRequiredModal from "@/components/AuthRequiredModal";
//
// 2. Add state:
//      const [authModal, setAuthModal] = useState(false);
//
// 3. Guard the action (e.g. clicking "Services"):
//      const handleServicesClick = (e) => {
//        if (!self) { e.preventDefault(); setAuthModal(true); return; }
//        navigate("/services");
//      };
//
// 4. Render modal:
//      <AuthRequiredModal
//        open={authModal}
//        onClose={() => setAuthModal(false)}
//        featureLabel="access the Services page"
//      />
