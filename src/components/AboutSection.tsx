import { Megaphone, CalendarDays, PhoneCall } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const features = [
  {
    number: "01",
    icon: Megaphone,
    title: "Community Announcements",
    description:
      "Stay updated with the latest news, government notices, and barangay updates relevant to West Rembo residents.",
  },
  {
    number: "02",
    icon: CalendarDays,
    title: "Event Calendar",
    description:
      "Browse upcoming events, meetings, and activities in the community — so you never miss what's happening in West Rembo.",
  },
  {
    number: "03",
    icon: PhoneCall,
    title: "Emergency Info & Contacts",
    description:
      "Access emergency hotlines, health center contacts, and safety tips to help you stay ready during urgent situations in West Rembo.",
  },
];

// ── Reusable scroll-reveal hook ──────────────────────────────────────────────
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

const AboutSection = () => {
  const { ref: headerRef, visible: headerVisible } = useScrollReveal(0.2);
  const cardRefs = features.map(() => useScrollReveal(0.15));

  return (
    <section id="about" className="py-20 sm:py-28 bg-background overflow-hidden">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes widthGrow {
          from { width: 0; }
          to   { width: 56px; }
        }
        .reveal-up {
          opacity: 0;
          transform: translateY(40px);
        }
        .reveal-up.visible {
          animation: fadeSlideUp 0.75s ease forwards;
        }
        .reveal-card {
          opacity: 0;
          transform: translateY(48px);
        }
        .reveal-card.visible {
          animation: fadeSlideUp 0.8s ease forwards;
        }
      `}</style>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-14 sm:mb-16">
          <div
            className={`inline-flex items-center gap-2 mb-5 reveal-up ${headerVisible ? "visible" : ""}`}
            style={{ animationDelay: "0s" }}
          >
            <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
            <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#d45ea3" }}>
              About this Website
            </span>
            <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
          </div>

          <h2
            className={`text-3xl sm:text-4xl font-bold text-foreground mb-3 leading-tight reveal-up ${headerVisible ? "visible" : ""}`}
            style={{ fontFamily: "'Georgia', serif", animationDelay: "0.12s" }}
          >
            Your Digital{" "}
            <span style={{ color: "#fa43ae" }}>Barangay Hub</span>
          </h2>

          <div
            className={`mx-auto mt-3 mb-5 rounded-full reveal-up ${headerVisible ? "visible" : ""}`}
            style={{ width: 56, height: 3, backgroundColor: "#d45ea3", animationDelay: "0.22s" }}
          />

          <p
            className={`text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed reveal-up ${headerVisible ? "visible" : ""}`}
            style={{ animationDelay: "0.32s" }}
          >
            This website is dedicated to sharing official announcements, events, and updates for the
            community of West Rembo. It serves as an information hub to keep residents connected and
            informed.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {features.map((feature, index) => {
            const { ref, visible } = cardRefs[index];
            const Icon = feature.icon;
            return (
              <div
                key={feature.number}
                ref={ref}
                className={`group relative bg-card rounded-2xl p-8 border border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden reveal-card ${visible ? "visible" : ""}`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Large watermark number */}
                <span
                  className="absolute -top-3 -right-1 text-8xl font-black select-none pointer-events-none leading-none"
                  style={{ color: "#fa43ae10" }}
                >
                  {feature.number}
                </span>

                {/* Left hover accent bar */}
                <div
                  className="absolute left-0 top-6 bottom-6 w-0 group-hover:w-1 rounded-r-full transition-all duration-300"
                  style={{ backgroundColor: "#d45ea3" }}
                />

                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: "#fa43ae18" }}
                >
                  <Icon className="w-6 h-6" style={{ color: "#d45ea3" }} strokeWidth={1.8} />
                </div>

                {/* Number */}
                <span
                  className="text-4xl font-black mb-3 block leading-none"
                  style={{ color: "#fa43ae", fontFamily: "'Georgia', serif" }}
                >
                  {feature.number}
                </span>

                <h3
                  className="text-lg font-bold text-foreground mb-3"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  {feature.title}
                </h3>

                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;