import Logo from "../../assets/West_Rembo_Logo.png";

const footerLinks = {
  about: {
    title: "ABOUT",
      links: [
        { label: "About Us", href: "/aboutus" },
        // { label: "Geographic", href: "#" },
        // { label: "Vision", href: "#" },
        // { label: "Mission", href: "#" },
      ],
      },
      quickAccess: {
        title: "QUICK ACCESS",
        links: [
          { label: "Services", href: "/services" },
          { label: "Calendar", href: "/calendar" },
          { label: "Log in", href: "/login" },
          { label: "Register", href: "/register" },
        ],
      },
      followUs: {
        title: "FOLLOW US",
        links: [{ label: "Facebook", href: "https://www.facebook.com/KapLeoBes" }],
      },
      help: {
        title: "HELP",
        links: [{ label: "Contact", href: "/contact" }],
      },
  };

const Footer = () => {
  return (
    <footer style={{ backgroundColor: "#0a1d4a" }} className="pt-14 pb-6">
      {/* Top pink accent bar */}
      <div style={{ height: 3, backgroundColor: "#c2467d", marginBottom: 0 }} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl pt-10">

        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row justify-between gap-10 mb-10">

          {/* Logo + tagline */}
          <div className="flex flex-col gap-4 max-w-xs">
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: "rgba(255,255,255,0.07)",
                  border: "1.5px solid rgba(194,70,125,0.45)",
                }}
              >
                <img src={Logo} alt="Barangay West Rembo Logo" className="w-11 h-11 object-contain" />
              </div>
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-[0.16em] mb-0.5"
                  style={{ color: "#e8a0bf" }}
                >
                  Republic of the Philippines
                </p>
                <span
                  className="text-base font-bold text-white leading-snug"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  Barangay <span style={{ color: "#e8a0bf" }}>West Rembo</span>
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
              Serving every resident of West Rembo with transparency, efficiency, and care.
              Makati City · District II
            </p>
            {/* Pink accent bar */}
            <div style={{ width: 40, height: 1, backgroundColor: "#c2467d" }} />
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {Object.values(footerLinks).map((section) => (
              <div key={section.title}>
                <h4
                  className="text-xs font-black uppercase tracking-[0.18em] mb-4"
                  style={{ color: "#e8a0bf" }}
                >
                  {section.title}
                </h4>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-xs transition-colors duration-200"
                        style={{ color: "rgba(255,255,255,0.45)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#e8a0bf")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mb-6" style={{ backgroundColor: "rgba(194,70,125,0.15)" }} />

        {/* Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            © 2025 Barangay West Rembo™. All Rights Reserved.
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>
            Official Barangay Portal · Makati City
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;