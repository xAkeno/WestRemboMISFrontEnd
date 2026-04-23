import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

import serviceClearance from "../../assets/service-clearance.png";
import serviceRegistration from "../../assets/service-business.png";
import serviceBusiness from "../../assets/service-registration.png";

const services = [
  {
    image: serviceRegistration,
    title: "Resident Registration",
    description:
      "Register as a resident of Barangay West Rembo to access community services, programs, and benefits. Our registration process is simple and efficient.",
    href: "/services/resident-registration",
    number: "01",
  },
  {
    image: serviceClearance,
    title: "Barangay Clearance",
    description:
      "Apply for barangay clearance for employment, travel, and other official purposes. Fast processing with online tracking available.",
    href: "/services/barangay-clearance",
    number: "02",
  },
  {
    image: serviceBusiness,
    title: "Business Clearance",
    description:
      "Obtain business permits and clearances to operate legally within our barangay. We support local entrepreneurs with streamlined processing.",
    href: "/services/business-clearance",
    number: "03",
  },
  {
    image: serviceBusiness,
    title: "Building Clearance",
    description:
      "Obtain building permits and clearances to ensure compliance with local regulations. We support property owners with streamlined processing.",
    href: "/services/building-clearance",
    number: "04",
  },
];

// ── Scroll-reveal hook ───────────────────────────────────────────────────────
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
  const { ref: headerRef, visible: headerVisible } = useScrollReveal(0.2);
  const serviceReveal = services.map(() => useScrollReveal(0.12));

  return (
    <section className="py-16 md:py-28 bg-background overflow-hidden">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(44px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideRight {
          from { opacity: 0; transform: translateX(-50px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeSlideLeft {
          from { opacity: 0; transform: translateX(50px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .srv-hidden { opacity: 0; }
        .srv-img-even  { animation: fadeSlideRight 0.85s ease forwards; }
        .srv-img-odd   { animation: fadeSlideLeft  0.85s ease forwards; }
        .srv-text-even { animation: fadeSlideLeft  0.85s ease forwards; }
        .srv-text-odd  { animation: fadeSlideRight 0.85s ease forwards; }
        .srv-header    { animation: fadeSlideUp    0.75s ease forwards; }
      `}</style>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">

        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-16 sm:mb-20">
          <div
            className={`inline-flex items-center gap-3 mb-4 srv-hidden ${headerVisible ? "srv-header" : ""}`}
            style={{ animationDelay: "0s" }}
          >
            <div style={{ width: 32, height: 1, backgroundColor: "#c2467d" }} />
            <span className="text-xs font-bold uppercase tracking-[0.20em]" style={{ color: "#c2467d" }}>
              Community Services
            </span>
            <div style={{ width: 32, height: 1, backgroundColor: "#c2467d" }} />
          </div>

          <h2
            className={`font-bold text-foreground mb-3 leading-tight srv-hidden ${headerVisible ? "srv-header" : ""}`}
            style={{ fontFamily: "'Georgia', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.5rem)", animationDelay: "0.12s" }}
          >
            Services{" "}
            <span style={{ color: "#c2467d" }}>We Offer</span>
          </h2>

          <div
            className={`srv-hidden ${headerVisible ? "srv-header" : ""}`}
            style={{ width: 48, height: 2, backgroundColor: "#c2467d", margin: "12px auto 20px", animationDelay: "0.22s" }}
          />

          <p
            className={`text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed srv-hidden ${headerVisible ? "srv-header" : ""}`}
            style={{ animationDelay: "0.32s" }}
          >
            Access essential barangay services online. We are committed to serving our community
            with efficiency, transparency, and care.
          </p>
        </div>

        {/* Services list */}
        <div className="space-y-16 md:space-y-24">
          {services.map((service, index) => {
            const { ref, visible } = serviceReveal[index];
            const isEven = index % 2 === 0;
            const imgClass = isEven ? "srv-img-even" : "srv-img-odd";
            const txtClass = isEven ? "srv-text-even" : "srv-text-odd";

            return (
              <div
                key={service.title}
                ref={ref}
                className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-8 md:gap-16`}
              >
                {/* Image */}
                <div
                  className={`w-full md:w-5/12 flex-shrink-0 srv-hidden ${visible ? imgClass : ""}`}
                  style={{ animationDelay: "0s" }}
                >
                  <div className="relative overflow-hidden group" style={{ borderRadius: 2 }}>
                    {/* Number badge */}
                    <div
                      className="absolute top-0 left-0 z-10 px-3 py-1.5 text-white text-xs font-bold uppercase tracking-wider"
                      style={{ backgroundColor: "#0f2a5e", fontFamily: "'Georgia', serif" }}
                    >
                      {service.number}
                    </div>

                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-64 md:h-72 object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: "linear-gradient(to top, rgba(15,42,94,0.35) 0%, transparent 60%)" }}
                    />
                  </div>
                </div>

                {/* Content */}
                <div
                  className={`w-full md:w-7/12 space-y-5 srv-hidden ${visible ? txtClass : ""}`}
                  style={{ animationDelay: "0.15s" }}
                >
                  <span
                    className="block font-black leading-none select-none"
                    style={{
                      color: "rgba(194,70,125,0.07)",
                      fontFamily: "'Georgia', serif",
                      fontSize: "5rem",
                    }}
                  >
                    {service.number}
                  </span>

                  <h3
                    className="font-bold text-foreground -mt-8 leading-snug"
                    style={{ fontFamily: "'Georgia', serif", fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)" }}
                  >
                    {service.title}
                  </h3>

                  <div style={{ width: 40, height: 2, backgroundColor: "#c2467d" }} />

                  <p className="text-muted-foreground text-base leading-relaxed">
                    {service.description}
                  </p>

                  <Link
                    to={service.href}
                    className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider transition-all duration-200 group/link hover:gap-3"
                    style={{ color: "#c2467d", letterSpacing: "0.08em" }}
                  >
                    Learn more
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;