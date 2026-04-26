import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Shield,
  Briefcase,
  Building2,
  UserPlus,
  ScrollText,
} from "lucide-react";

const services = [
  // {
  //   image: serviceRegistration,
  //   title: "Resident Registration",
  //   description:
  //     "Register as a resident of Barangay West Rembo to access community services, programs, and benefits. Our registration process is simple and efficient.",
  //   href: "/services/resident-registration",
  //   number: "01",
  // },
  {
    icon: Shield,
    title: "Barangay Clearance",
    href: "/services/barangay-clearance",
    number: "01",
  },
  {
    icon: Briefcase,
    title: "Business Clearance",
    href: "/services/business-clearance",
    number: "02",
  },
  {
    icon: Building2,
    title: "Building Clearance",
    href: "/services/building-clearance",
    number: "03",
  },
  {
    icon: FileText,
    title: "Barangay Certificate",
    href: "/services/barangay-certificate",
    number: "04",
  },  
];

const useScrollReveal = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
};

const ServicesSection = () => {
  const { ref: sectionRef, visible } = useScrollReveal(0.1);
  const { ref: headerRef, visible: headerVisible } = useScrollReveal(0.2);

  return (
    <section className="py-20 md:py-28 bg-background overflow-hidden">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(36px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .srv-hidden { opacity: 0; }
        .srv-show   { animation: fadeSlideUp 0.6s ease forwards; }
      `}</style>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">

        {/* Header */}
        <div ref={headerRef} className="text-center mb-14">
          <div
            className={`inline-flex items-center gap-3 mb-4 srv-hidden ${headerVisible ? "srv-show" : ""}`}
            style={{ animationDelay: "0s" }}
          >
            <div style={{ width: 32, height: 1, backgroundColor: "#c2467d" }} />
            <span className="text-xs font-bold uppercase tracking-[0.20em]" style={{ color: "#c2467d" }}>
              Community Services
            </span>
            <div style={{ width: 32, height: 1, backgroundColor: "#c2467d" }} />
          </div>

          <h2
            className={`font-bold text-foreground mb-3 leading-tight srv-hidden ${headerVisible ? "srv-show" : ""}`}
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "clamp(1.6rem, 3.5vw, 2.5rem)",
              animationDelay: "0.12s",
            }}
          >
            Services <span style={{ color: "#c2467d" }}>We Offer</span>
          </h2>

          <div
            className={`srv-hidden ${headerVisible ? "srv-show" : ""}`}
            style={{ width: 48, height: 2, backgroundColor: "#c2467d", margin: "12px auto 20px", animationDelay: "0.22s" }}
          />

          <p
            className={`text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed srv-hidden ${headerVisible ? "srv-show" : ""}`}
            style={{ animationDelay: "0.32s" }}
          >
            Access essential barangay services online. We are committed to serving our community
            with efficiency, transparency, and care.
          </p>
        </div>

        {/* Card Grid */}
        <div
          ref={sectionRef}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.title}
                to={service.href}
                className={`srv-hidden ${visible ? "srv-show" : ""} group flex items-center gap-4 px-6 py-5 w-full transition-all duration-200`}
                style={{
                  animationDelay: `${i * 0.08}s`,
                  borderRadius: 2,
                  border: "1px solid #e5e7eb",
                  borderLeft: "4px solid #c2467d",
                  backgroundColor: "var(--card, #fff)",
                  boxShadow: "0 1px 8px rgba(10,20,60,0.07)",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(10,20,60,0.13)";
                  (e.currentTarget as HTMLElement).style.borderColor = "#c2467d";
                  (e.currentTarget as HTMLElement).style.borderLeftColor = "#c2467d";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 8px rgba(10,20,60,0.07)";
                  (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb";
                  (e.currentTarget as HTMLElement).style.borderLeftColor = "#c2467d";
                }}
              >
                {/* Icon box */}
                <div
                  className="flex-shrink-0 w-11 h-11 flex items-center justify-center"
                  style={{
                    backgroundColor: "rgba(15,42,94,0.06)",
                    borderRadius: 2,
                    border: "1px solid rgba(15,42,94,0.10)",
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: "#0f2a5e" }} />
                </div>

                {/* Title */}
                <span
                  className="font-bold text-base flex-1"
                  style={{ color: "#0f2a5e", fontFamily: "'Georgia', serif" }}
                >
                  {service.title}
                </span>

                {/* Number badge */}
                <span
                  className="text-xs font-black flex-shrink-0"
                  style={{ color: "rgba(194,70,125,0.35)", fontFamily: "'Georgia', serif" }}
                >
                  {service.number}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;