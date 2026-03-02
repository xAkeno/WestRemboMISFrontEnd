import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "../../assets/West_Rembo_Logo.png";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import ProfileDropdown from "./ProfileDropdown";
import AuthRequiredModal from "../AuthRequiredModal";
// ── Protected routes that require login ───────────────────────────────────────
const navLinks = [
  { label: "Home",     href: "/home",     protected: false },
  { label: "About",    href: "/aboutus",  protected: false },
  { label: "Services", href: "/services", protected: false  },
  { label: "Calendar", href: "/calendar", protected: false  },
  { label: "Contact",  href: "/contact",  protected: false },
];
var isAdminStaff = false;

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark,         setIsDark        ] = useState(false);
  const [scrolled,       setScrolled      ] = useState(false);
  const [self,           setSelf          ] = useState<any>(null);
  const [authModal,      setAuthModal     ] = useState(false);
  const [authFeature,    setAuthFeature   ] = useState("");

  if (self && (self.role === "ADMIN" || self.role === "STAFF")) {
    isAdminStaff = true;
  }


  const location = useLocation();
  const navigate = useNavigate();

  // Sync theme from localStorage
  useEffect(() => { setIsDark(localStorage.getItem("theme") === "dark"); }, []);

  // Listen for same-tab theme changes from ProfileDropdown
  useEffect(() => {
    const handler = (e: Event) =>
      setIsDark((e as CustomEvent<{ dark: boolean }>).detail.dark);
    window.addEventListener("theme-change", handler);
    return () => window.removeEventListener("theme-change", handler);
  }, []);

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fetch logged-in user
  useEffect(() => {
    axios
      .get("https://westrembomis.onrender.com/api/details", { withCredentials: true })
      .then((res) => { if (res.status === 200) setSelf(res.data.data); })
      .catch(() => {/* not authenticated — silently ignore */});
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  // Guard protected nav links
  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    link: (typeof navLinks)[number]
  ) => {
    if (link.protected && !self) {
      e.preventDefault();
      setAuthFeature(`access the ${link.label} page`);
      setAuthModal(true);
      setMobileMenuOpen(false);
    }
  };

  const signout = async () => {
    try {
      await axios.post(
        "https://westrembomis.onrender.com/api/logout",
        { withCredentials: true }
      );

      setSelf(null);
      navigate("/home");
      toast.success("You have been signed out.");
    } catch (error) {
      toast.error("Failed to sign out.");
    }
  }; 

  const isActive = (href: string) => location.pathname === href;
  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#0f2a5e]"
        style={{
          borderBottom: scrolled
            ? "1px solid rgba(194,70,125,0.25)"
            : "3px solid #c2467d",
          boxShadow: scrolled ? "0 2px 20px rgba(10,20,60,0.25)" : "none",
        }}
      >
        <div className="container mx-auto px-4 sm:px-6">
          <nav className="flex items-center justify-between py-3">

            {/* ── Logo ── */}
            <div
              className="flex items-center gap-3 cursor-pointer flex-shrink-0"
              onClick={() => navigate("/home")}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1.5px solid rgba(194,70,125,0.45)",
                }}
              >
                <img src={Logo} alt="Barangay West Rembo" className="w-11 h-11 object-contain" />
              </div>
              <div>
                <p
                  className="text-white font-bold leading-tight"
                  style={{ fontFamily: "'Georgia', serif", fontSize: "0.95rem" }}
                >
                  Barangay <span style={{ color: "#e8a0bf" }}>West Rembo</span>
                </p>
                <p
                  className="uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.38)", fontSize: 9 }}
                >
                  Taguig City · District II
                </p>
              </div>
            </div>

            {/* ── Desktop nav ── */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  onClick={(e) => {
                    handleNavClick(e as any, link); // keep your protected guard
                    if (!link.protected || self) navigate(link.href);
                  }}
                  className="cursor-pointer px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-all duration-200"
                  style={{
                    color: isActive(link.href) ? "#fff" : "rgba(255,255,255,0.60)",
                    borderBottom: isActive(link.href)
                      ? "2px solid #c2467d"
                      : "2px solid transparent",
                    letterSpacing: "0.06em",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive(link.href)) {
                      (e.currentTarget as HTMLElement).style.color = "#fff";
                      (e.currentTarget as HTMLElement).style.borderBottomColor = "rgba(194,70,125,0.40)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(link.href)) {
                      (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.60)";
                      (e.currentTarget as HTMLElement).style.borderBottomColor = "transparent";
                    }
                  }}
                >
                  {link.label}
                </a>
              ))}

              <div className="ml-4 pl-4" style={{ borderLeft: "1px solid rgba(255,255,255,0.12)" }}>
                {self ? (
                  <ProfileDropdown self={self} />
                ) : (
                  <a
                    onClick={() => { navigate("/login"); setMobileMenuOpen(false); }}
                    className="px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white transition-all duration-200 cursor-pointer"
                    style={{ border: "1px solid rgba(194,70,125,0.50)", borderRadius: 2, letterSpacing: "0.06em" }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(194,70,125,0.15)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")
                    }
                  >
                    Sign In
                  </a>
                )}
              </div>
            </div>

            {/* ── Mobile: avatar indicator + hamburger ── */}
            <div className="md:hidden flex items-center gap-3">
              {self && (
                <div
                  className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                  style={{ border: "1.5px solid rgba(194,70,125,0.55)" }}
                >
                  <img
                    src={
                      self.url_photo
                        ? self.url_photo
                        : "https://png.pngtree.com/png-vector/20221130/ourmid/pngtree-user-profile-button-for-web-and-mobile-design-vector-png-image_41767880.jpg" // <-- path to your default image
                    }
                    className="w-full h-full object-cover"
                    alt="Avatar"
                  />
                </div>
              )}
              <button
                className="w-9 h-9 flex items-center justify-center cursor-pointer"
                style={{ color: "rgba(255,255,255,0.80)" }}
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </nav>
        </div>

        {/* ── Mobile drawer ── */}
        {mobileMenuOpen && (
          <div
            className="md:hidden"
            style={{ borderTop: "1px solid rgba(194,70,125,0.20)" }}
          >
            {/* Nav links */}
            <div className="flex flex-col px-4 pt-2 pb-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  onClick={(e) => {
                    handleNavClick(e as any, link);
                    if (!link.protected || self) {
                      navigate(link.href);
                      setMobileMenuOpen(false);
                    }
                  }}
                  className="flex items-center justify-between px-3 py-3 text-sm font-semibold uppercase tracking-wider transition-colors duration-150 cursor-pointer"
                  style={{
                    color: isActive(link.href) ? "#fff" : "rgba(255,255,255,0.65)",
                    borderLeft: isActive(link.href)
                      ? "3px solid #c2467d"
                      : "3px solid transparent",
                  }}
                >
                  {link.label}
                  {/* Badge for protected links when not logged in */}
                  {link.protected && !self && (
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 flex-shrink-0"
                      style={{
                        backgroundColor: "rgba(194,70,125,0.15)",
                        color: "#e8a0bf",
                        borderRadius: 1,
                      }}
                    >
                      Login required
                    </span>
                  )}
                </a>
              ))}
            </div>

            {/* Divider */}
            <div className="mx-4 my-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

            {/* Profile panel — rendered FLAT inline, no floating dropdown = no glitch */}
            <div className="px-4 pb-4">
              {self ? (
                <MobileProfilePanel
                  self={self}
                  onClose={() => setMobileMenuOpen(false)}
                />
              ) : (
                <a
                  onClick={() => { navigate("/login"); setMobileMenuOpen(false); }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors duration-150 cursor-pointer"
                  style={{ border: "1px solid rgba(194,70,125,0.50)", borderRadius: 2 }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(194,70,125,0.12)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")
                  }
                >
                  Sign In
                </a>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Auth modal */}
      <AuthRequiredModal
        open={authModal}
        onClose={() => setAuthModal(false)}
        featureLabel={authFeature}
      />
    </>
  );
};

// ─── Flat mobile profile panel ────────────────────────────────────────────────
// Renders inline inside the drawer — eliminates the z-index / scroll glitch
// that occurs when a floating dropdown is nested inside overflow:hidden parents.
const MobileProfilePanel = ({
    self,
    onClose,
  }: {
    self: any;
    onClose: () => void;
  }) => {
    const navigate = useNavigate();

  const signout = async () => {
    try {
      await axios.post(
        "https://westrembomis.onrender.com/api/logout",
        {},
        { withCredentials: true }
      );
      navigate("/home");
      toast.success("You have been signed out.");
    } catch (error) {
      toast.error("Failed to sign out.");
    }
  };

    
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  const toggleDark = () => {
    const html = document.documentElement;
    const next = !html.classList.contains("dark");
    html.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
    window.dispatchEvent(new CustomEvent("theme-change", { detail: { dark: next } }));
  };

  const row =
    "flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium transition-colors duration-150 cursor-pointer";
  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: 2,
        border: "1px solid rgba(194,70,125,0.22)",
        backgroundColor: "rgba(255,255,255,0.04)",
      }}
    >
      {/* User info */}
      <div
        className="flex items-center gap-3 px-3 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div
          className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
          style={{ border: "1.5px solid rgba(194,70,125,0.55)" }}
        >
        <img
          src={
            self.url_photo
              ? "ttps://pub-ac8a9453b771431ba35a02dd460d8da1.r2.dev/" + self.url_photo
              : "https://png.pngtree.com/png-vector/20221130/ourmid/pngtree-user-profile-button-for-web-and-mobile-design-vector-png-image_41767880.jpg" // <-- path to your default image
          }
          className="w-full h-full object-cover"
          alt="Avatar"
        />
        </div>
        <div className="min-w-0">
          <p
            className="text-white font-bold text-sm truncate"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            {self.first_name} {self.surname}
          </p>
          <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.42)" }}>
            {self.email}
          </p>
        </div>
      </div>

      {/* Links */}
      {[
        { href: "/profile",    label: "Profile",     icon: <path stroke="currentColor" strokeWidth="2" d="M7 17v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1a3 3 0 0 0-3-3h-4a3 3 0 0 0-3 3Zm8-9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /> },
        { href: "/myrequest",  label: "My Requests", icon: <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M20 6H10m0 0a2 2 0 1 0-4 0m4 0a2 2 0 1 1-4 0m0 0H4m16 6h-2m0 0a2 2 0 1 0-4 0m4 0a2 2 0 1 1-4 0m0 0H4m16 6H10m0 0a2 2 0 1 0-4 0m4 0a2 2 0 1 1-4 0m0 0H4" /> },
      ].map(({ href, label, icon }) => (
        <a
          key={href}
          onClick={() => {
              onClose();
              navigate(href);
            }
          }
          className={row}
          style={{ color: "rgba(255,255,255,0.72)", cursor: "pointer" }}
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">{icon}</svg>
          {label}
        </a>
      ))}

      {isAdminStaff && (
        <a
          onClick={() => {
              onClose
              navigate("/dashboard")
            }
          }
          className={row}
          style={{ color: "rgba(255,255,255,0.72)" }}
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" />
          </svg>
          Admin Panel
        </a>
      )}

      {/* Dark mode */}
      <button
        onClick={toggleDark}
        className={`${row} justify-between`}
        style={{ color: "rgba(255,255,255,0.72)" }}
      >
        <div className="flex items-center gap-3">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
            {isDark ? (
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5V3m0 18v-2M7.05 7.05 5.636 5.636m12.728 12.728L16.95 16.95M5 12H3m18 0h-2M7.05 16.95l-1.414 1.414M18.364 5.636 16.95 7.05M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            ) : (
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21a9 9 0 0 1-.5-17.986V3c-.354.966-.5 1.911-.5 3a9 9 0 0 0 9 9c.239 0 .254.018.488 0A9.004 9.004 0 0 1 12 21Z" />
            )}
          </svg>
          {isDark ? "Light Mode" : "Dark Mode"}
        </div>
        {/* Toggle pill */}
        <div
          className="relative w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-200 cursor-pointer"
          style={{ backgroundColor: isDark ? "#c2467d" : "rgba(255,255,255,0.18)" }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200"
            style={{ left: isDark ? "calc(100% - 18px)" : "2px" }}
          />
        </div>
      </button>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)", margin: "2px 0" }} />

      {/* Sign out */}
      <a

        onClick={signout}
        className={row}
        style={{ color: "#f87171" }}
      >
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H8m12 0-4 4m4-4-4-4M9 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2" />
        </svg>
        Sign Out
      </a>
    </div>
  );
};

export default Header;