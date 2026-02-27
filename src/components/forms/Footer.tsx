import Logo from "../../assets/West_Rembo_Logo.png";

const footerLinks = {
  about: {
    title: "ABOUT",
    links: [
      { label: "History", href: "#" },
      { label: "Geographic", href: "#" },
      { label: "Vision", href: "#" },
      { label: "Mission", href: "#" },
    ],
  },
  quickAccess: {
    title: "QUICK ACCESS",
    links: [
      { label: "Announcement", href: "#" },
      { label: "Calendar", href: "#" },
    ],
  },
  followUs: {
    title: "FOLLOW US",
    links: [{ label: "Facebook", href: "#" }],
  },
  help: {
    title: "HELP",
    links: [{ label: "Contact", href: "#" }],
  },
};

const Footer = () => {
  return (
    <footer className="dark:bg-pink-800  bg-[#ce73a7] pt-14 pb-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">

        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row justify-between gap-10 mb-10">

          {/* Logo + tagline */}
          <div className="flex flex-col gap-4 max-w-xs">
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                style={{
                  border: "2px solid #ffffff",
                  boxShadow: "0 0 0 4px rgba(212,94,163,0.12)",
                }}
              >
                <img src={Logo} alt="Barangay West Rembo Logo" className="w-11 h-11 object-contain" />
              </div>
              <span
                className="text-lg font-bold text-white leading-snug"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                Barangay<br />
                <span style={{ color: "#ffffff" }}>West Rembo</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255, 255, 255, 0.45)" }}>
              Serving every resident of West Rembo with transparency, efficiency, and care.
            </p>
            {/* Pink accent bar */}
            <div
              className="rounded-full"
              style={{ width: 40, height: 2, backgroundColor: "#d45ea3" }}
            />
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {Object.values(footerLinks).map((section) => (
              <div key={section.title}>
                <h4
                  className="text-sm font-black uppercase tracking-[0.18em] mb-4"
                  style={{ color: "#fdfdfd" }}
                >
                  {section.title}
                </h4>
                <ul className="space-y-2.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm transition-colors duration-200 hover:text-white"
                        style={{ color: "rgb(255, 255, 255)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#000000")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "rgb(255, 255, 255)")}
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
        <div className="h-px mb-6" style={{ backgroundColor: "rgba(212,94,163,0.15)" }} />

        {/* Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
            © 2025 Barangay West Rembo™. All Rights Reserved.
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.20)" }}>
            Official Barangay Portal · Makati City
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;