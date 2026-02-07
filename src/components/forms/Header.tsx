import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "../../assets/West_Rembo_Logo.png";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import ProfileDropdown from "./ProfileDropdown";

const navLinks = [
  { label: "Home", href: "/home" },
  { label: "About", href: "/aboutus" },
  { label: "Services", scrollTo: "request-form" },
  { label: "Calendar", href: "#" },
  { label: "Contact", href: "/contact" },
];

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const [self, setSelf] = useState(null);

  const api = () => {
    const url = "http://127.0.0.1:8000/api/details";
    axios.get(url,{withCredentials: true}).then((response) => {
      console.log(response.data);
      if(response.status === 200){
        setSelf(response.data.data);
        console.log(response.data);
      } else {
        toast.error("Account is not log in");
      }
    }).catch((error) => {
      toast.error("Error fetching data: " + error.message);
    });
  }

  useEffect(() => {
    api();
  }, []);

  const handleScroll = (id: string) => {
    // If already on /home → just scroll
    if (location.pathname === "/home") {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } 
    // If on another page → navigate first
    else {
      navigate(`/home#${id}`);
    }

    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#097b0a] backdrop-blur-sm ">
      <div className="container mx-auto px-2 ">
        <nav className="flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-emerald-500 flex items-center justify-center">
              <img src={Logo} alt="Barangay West Rembo Logo" />
            </div>
            <span className="text-lg font-semibold text-primary-foreground">
              Barangay West Rembo
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.scrollTo ? (
                <button
                  key={link.label}
                  onClick={() => handleScroll(link.scrollTo)}
                  className="text-white hover:text-primary-foreground transition-colors text-sm font-medium"
                >
                  {link.label}
                </button>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-white hover:text-primary-foreground transition-colors text-sm font-medium"
                >
                  {link.label}
                </a>
              )
            )}

            {
              self ? <ProfileDropdown self={self} /> : <a
                href="/"
                className="text-primary-foreground underline underline-offset-4 text-sm font-medium hover:text-gold transition-colors"
              >
              Sign In
            </a>
            }
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-primary-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm font-medium"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#"
                className="text-primary-foreground underline underline-offset-4 text-sm font-medium"
              >
                Sign In
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
