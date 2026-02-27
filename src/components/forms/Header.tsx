import { useEffect, useState } from "react";
import { MapPin, Menu, Phone, X } from "lucide-react";
import Logo from "../../assets/West_Rembo_Logo.png";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import ProfileDropdown from "./ProfileDropdown";

const navLinks = [
  { label: "Home", href: "/home" },
  { label: "About", href: "/aboutus" },
  { label: "Services", href: "/services" },
  { label: "Calendar", href: "/calendar" },
  { label: "Contact", href: "/contact" },
];

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const [self, setSelf] = useState(null);

  // Read saved theme on mount
  useEffect(() => {
    setIsDark(localStorage.getItem("theme") === "dark");
  }, []);

  // Listen for instant theme-change events from ProfileDropdown (same tab)
  useEffect(() => {
    const handler = (e: Event) => {
      setIsDark((e as CustomEvent<{ dark: boolean }>).detail.dark);
    };
    window.addEventListener("theme-change", handler);
    return () => window.removeEventListener("theme-change", handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const api = () => {
    const url = "http://127.0.0.1:8000/api/details";
    axios.get(url, { withCredentials: true }).then((response) => {
      if (response.status === 200) {
        setSelf(response.data.data);
      } else {
        toast.error("Account is not log in");
      }
    }).catch((error) => {
      toast.error("Error fetching data: " + error.message);
    });
  };

  useEffect(() => {
    api();
  }, []);

  const handleScroll = (id: string) => {
    if (location.pathname === "/home") {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/home#${id}`);
    }
    setMobileMenuOpen(false);
  };

  const isActive = (href: string) => location.pathname === href;

  // Dark = deep navy-pink, Light = official navy
  const bgColor = isDark ? "#1a0f2e" : "#0f2a5e";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: bgColor,
        borderBottom: scrolled ? "1px solid rgba(194,70,125,0.25)" : "3px solid #c2467d",
        boxShadow: scrolled ? "0 2px 20px rgba(10,20,60,0.25)" : "none",
      }}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <nav className="flex items-center justify-between py-3">

          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/home")}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1.5px solid rgba(194,70,125,0.45)",
              }}
            >
              <img src={Logo} alt="Barangay West Rembo Logo" className="w-9 h-9 object-contain" />
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
                Makati City · District II
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-all duration-200"
                style={{
                  color: isActive(link.href) ? "#fff" : "rgba(255,255,255,0.60)",
                  borderBottom: isActive(link.href) ? "2px solid #c2467d" : "2px solid transparent",
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
                  href="/"
                  className="px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white transition-all duration-200"
                  style={{
                    border: "1px solid rgba(194,70,125,0.50)",
                    borderRadius: 2,
                    letterSpacing: "0.06em",
                  }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(194,70,125,0.15)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                >
                  Sign In
                </a>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center transition-colors"
            style={{ color: "rgba(255,255,255,0.80)" }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden pb-4 pt-2"
            style={{ borderTop: "1px solid rgba(194,70,125,0.20)" }}
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-3 py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors"
                  style={{
                    color: isActive(link.href) ? "#fff" : "rgba(255,255,255,0.65)",
                    borderLeft: isActive(link.href) ? "3px solid #c2467d" : "3px solid transparent",
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 px-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                {self ? (
                  <ProfileDropdown self={self} />
                ) : (
                  <a
                    href="/"
                    className="text-sm font-semibold uppercase tracking-wider text-white/80 underline underline-offset-4"
                  >
                    Sign In
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;