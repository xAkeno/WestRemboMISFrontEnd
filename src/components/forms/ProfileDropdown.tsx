import { useState, useEffect, useRef } from "react";
import { toast } from "../ui/sonner";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ─── Constants ────────────────────────────────────────────────────────────────
const WORKER_BASE = "https://bold-sunset-533d.clarkkentraguhos.workers.dev";
const DEFAULT_AVATAR =
  "https://png.pngtree.com/png-vector/20221130/ourmid/pngtree-user-profile-button-for-web-and-mobile-design-vector-png-image_41767880.jpg";

// ─── Same helper as ProfileManagement — handles raw path OR full URL ──────────
const buildImageUrl = (path: string | null | undefined): string => {
  if (!path) return DEFAULT_AVATAR;
  if (path.startsWith("http")) return path; // already a full URL, don't double-prefix
  return WORKER_BASE + "/" + path.replace(/^\//, "");
};

export default function ProfileDropdown({
  self,
  onSignOut,
}: {
  self: {
    url_photo: string;
    first_name: string;
    surname: string;
    email: string;
    role: string;
  } | null;
  onSignOut: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const signout = async () => {
    navigate("/home");
    setIsOpen(false);
    onSignOut();
    try {
      await axios.post(
        "https://westrembomis.onrender.com/api/logout",
        {},
        { withCredentials: true }
      );
      toast.success("You have been signed out.");
    } catch {
      toast.error("Failed to sign out.");
    }
  };

  const toggleDarkMode = () => {
    const html = document.documentElement;
    const isCurrentlyDark = html.classList.contains("dark");
    if (isCurrentlyDark) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setIsDark(!isCurrentlyDark);
  };

  if (!self) {
    return (
      <a
        onClick={() => navigate("/login")}
        className="text-primary-foreground underline underline-offset-4 text-sm font-medium hover:text-gold transition-colors cursor-pointer"
      >
        Sign In
      </a>
    );
  }

  const avatarUrl = buildImageUrl(self.url_photo);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 focus:outline-none"
      >
        <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/20">
          <img
            src={avatarUrl}
            className="w-full h-full object-cover"
            alt="Avatar"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
              (e.currentTarget as HTMLImageElement).onerror = null;
            }}
          />
        </div>
        <span className="text-white/70 text-xs">{isOpen ? "↑" : "↓"}</span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-3 w-72 z-50 rounded-2xl overflow-hidden border border-border bg-card"
          style={{ boxShadow: "0 8px 32px rgba(212,94,163,0.18)" }}
        >
          <div style={{ height: 3, backgroundColor: "#d45ea3" }} />

          <div className="p-4" style={{ borderBottom: "1px solid #fce7f3" }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                style={{ border: "2px solid #d45ea3" }}
              >
                <img
                  className="w-full h-full object-cover"
                  src={avatarUrl}
                  alt="Avatar"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                    (e.currentTarget as HTMLImageElement).onerror = null;
                  }}
                />
              </div>
              <div className="min-w-0">
                <p
                  className="font-bold text-sm text-foreground truncate"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  {self.first_name + " " + self.surname}
                </p>
                <p className="text-xs text-muted-foreground truncate">{self.email}</p>
              </div>
            </div>
          </div>

          <ul className="p-2 space-y-0.5">
            <li>
              <a
                onClick={() => navigate("/profile")}
                className="cursor-pointer flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-foreground transition-colors duration-150 hover:bg-[#fdf2f8] hover:text-[#d45ea3] group"
              >
                <svg className="w-4 h-4 text-muted-foreground group-hover:text-[#d45ea3]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeWidth="2" d="M7 17v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1a3 3 0 0 0-3-3h-4a3 3 0 0 0-3 3Zm8-9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                Profile
              </a>
            </li>
            <li>
              <a
                onClick={() => navigate("/myrequest")}
                className="cursor-pointer flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-foreground transition-colors duration-150 hover:bg-[#fdf2f8] hover:text-[#d45ea3] group"
              >
                <svg className="w-4 h-4 text-muted-foreground group-hover:text-[#d45ea3]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M20 6H10m0 0a2 2 0 1 0-4 0m4 0a2 2 0 1 1-4 0m0 0H4m16 6h-2m0 0a2 2 0 1 0-4 0m4 0a2 2 0 1 1-4 0m0 0H4m16 6H10m0 0a2 2 0 1 0-4 0m4 0a2 2 0 1 1-4 0m0 0H4" />
                </svg>
                My Requests
              </a>
            </li>

            {self.role === "ADMIN" && (
              <li>
                <a
                  onClick={() => navigate("/dashboard")}
                  className="cursor-pointer flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-foreground transition-colors duration-150 hover:bg-[#fdf2f8] hover:text-[#d45ea3] group"
                >
                  <svg className="w-4 h-4 text-muted-foreground group-hover:text-[#d45ea3]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" />
                  </svg>
                  Admin Panel
                </a>
              </li>
            )}

            {/* Dark mode toggle */}
            <li>
              <button
                onClick={toggleDarkMode}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm text-foreground transition-colors duration-150 hover:bg-[#fdf2f8] hover:text-[#d45ea3] group"
              >
                {isDark ? (
                  <svg className="w-4 h-4 text-muted-foreground group-hover:text-[#d45ea3]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5V3m0 18v-2M7.05 7.05 5.636 5.636m12.728 12.728L16.95 16.95M5 12H3m18 0h-2M7.05 16.95l-1.414 1.414M18.364 5.636 16.95 7.05M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-muted-foreground group-hover:text-[#d45ea3]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21a9 9 0 0 1-.5-17.986V3c-.354.966-.5 1.911-.5 3a9 9 0 0 0 9 9c.239 0 .254.018.488 0A9.004 9.004 0 0 1 12 21Z" />
                  </svg>
                )}
                <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                <div
                  className="ml-auto relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0"
                  style={{ backgroundColor: isDark ? "#d45ea3" : "#e2e8f0" }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200"
                    style={{ left: isDark ? "calc(100% - 18px)" : "2px" }}
                  />
                </div>
              </button>
            </li>

            <li>
              <div className="h-px mx-2 my-1" style={{ backgroundColor: "#fce7f3" }} />
            </li>

            <li>
              <a
                onClick={signout}
                className="cursor-pointer flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 hover:bg-red-50"
                style={{ color: "#e11d48" }}
              >
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H8m12 0-4 4m4-4-4-4M9 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2" />
                </svg>
                Sign Out
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}