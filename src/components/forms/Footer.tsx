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
    <footer className="bg-[#097b0a] pt-12 pb-6">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row justify-between gap-10 mb-10">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-emerald-500 flex items-center justify-center shrink-0">
              <img src={Logo} alt="Barangay West Rembo Logo" className="w-12 h-12" />
            </div>
            <span className="text-xl font-semibold text-primary-foreground">
              Barangay West Rembo
            </span>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-16">
            {Object.values(footerLinks).map((section) => (
              <div key={section.title}>
                <h4 className="text-sm font-semibold text-primary-foreground mb-4">
                  {section.title}
                </h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
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
        <div className="h-px bg-primary-foreground/10 mb-6" />

        {/* Copyright */}
        <p className="text-center text-primary-foreground/50 text-sm">
          © 2025 Barangay West Rembo™. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
