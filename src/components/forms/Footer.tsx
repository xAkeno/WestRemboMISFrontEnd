import Logo from "../../assets/West_Rembo_Logo.png";
import { useTranslation } from "react-i18next";



const Footer = () => {
 const { t } = useTranslation('common');
  
  const footerLinks = {
  about: {
    title: t('footer.label.title'),
    links: [
      { label: t('footer.subLabel.sub'), href: "#" },
      { label: t('footer.subLabel.subTwo'), href: "#" },
      { label: t('footer.subLabel.subThree'), href: "#" },
      { label: t('footer.subLabel.subFour'), href: "#" },
    ],
  },
  quickAccess: {
    title: t('footer.label.titleTwo'),
    links: [
      { label: t('footer.subLabel.subFive'), href: "#" },
      { label: t('footer.subLabel.subSix'), href: "#" },
    ],
  },
  followUs: {
    title: t('footer.label.titleThree'),
    links: [{ label: t('footer.subLabel.subSeven'), href: "#" }],
  },
  help: {
    title: t('footer.label.titleFour'),
    links: [{ label: t('footer.subLabel.subEight'), href: "#" }],
  },
};
  
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
              {t('footer.logo.title')}
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
          {t('footer.logo.copyright')}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
