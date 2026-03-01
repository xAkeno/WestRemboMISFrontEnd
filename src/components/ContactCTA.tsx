import { ArrowRight, MapPin, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const ContactCTA = () => {
  return (
    <section className="py-20 sm:py-28 bg-background relative overflow-hidden">
      {/* Subtle diagonal texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `repeating-linear-gradient(-45deg, #0f2a5e, #0f2a5e 1px, transparent 1px, transparent 20px)`,
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          {/* Left — text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-3 mb-4 justify-center lg:justify-start">
              <div style={{ width: 32, height: 1, backgroundColor: "#c2467d" }} />
              <span className="text-xs font-bold uppercase tracking-[0.20em]" style={{ color: "#c2467d" }}>
                Get in Touch
              </span>
              <div style={{ width: 32, height: 1, backgroundColor: "#c2467d" }} />
            </div>

            <h2
              className="font-bold text-foreground mb-3 leading-tight"
              style={{ fontFamily: "'Georgia', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.25rem)" }}
            >
              Have a Question or{" "}
              <span style={{ color: "#c2467d" }}>Concern?</span>
            </h2>

            <div style={{ width: 48, height: 2, backgroundColor: "#c2467d", margin: "12px auto 20px" }} className="mx-auto lg:mx-0" />

            <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              We are here to help. Reach out to the Barangay West Rembo office for any
              inquiries, concerns, or feedback. Our team is ready to assist you.
            </p>

            {/* Quick contact info */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              {[
                { icon: Phone, text: "(02) 8836 9731" },
                { icon: Mail, text: "leobes27@gmail.com" },
                { icon: MapPin, text: "West Rembo, Taguig City" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#f0f4ff", borderRadius: 1 }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: "#0f2a5e" }} />
                  </div>
                  <span className="text-sm text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>

            {/* CTA button */}
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-3 text-white text-sm font-semibold uppercase tracking-wider transition-all duration-200 group"
              style={{
                backgroundColor: "#0f2a5e",
                borderRadius: 1,
                letterSpacing: "0.08em",
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#0f2a5e"}
            >
              Contact the Barangay
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Right — office hours card */}
          <div className="flex-shrink-0 w-full max-w-sm">
            <div
              className="relative overflow-hidden p-8 text-center"
              style={{
                background: "linear-gradient(145deg, #0f2a5e 0%, #1a3d7c 50%, #3b1030 100%)",
                borderRadius: 2,
                borderTop: "3px solid #c2467d",
                boxShadow: "0 8px 40px rgba(10,20,60,0.25)",
              }}
            >
              {/* Subtle texture */}
              <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                  backgroundImage: `repeating-linear-gradient(-45deg, #fff, #fff 1px, transparent 1px, transparent 18px)`,
                }}
              />

              {/* Icon */}
              <div
                className="w-14 h-14 flex items-center justify-center mx-auto mb-5 relative"
                style={{ backgroundColor: "rgba(194,70,125,0.20)", border: "1px solid rgba(194,70,125,0.35)", borderRadius: 2 }}
              >
                <Mail className="w-7 h-7" style={{ color: "#e8a0bf" }} strokeWidth={1.5} />
              </div>

              <p
                className="text-xs font-bold uppercase tracking-[0.18em] mb-2 relative"
                style={{ color: "#e8a0bf" }}
              >
                Barangay Hall
              </p>

              <h3
                className="text-xl font-bold text-white mb-2 relative"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                Office Hours
              </h3>

              <div
                className="mx-auto mb-5 relative"
                style={{ width: 36, height: 1, backgroundColor: "rgba(194,70,125,0.50)" }}
              />

              <div className="space-y-1.5 text-sm relative mb-6">
                <p className="text-white/60 uppercase tracking-wider text-xs">Monday – Saturday</p>
                <p className="text-white font-bold text-xl" style={{ fontFamily: "'Georgia', serif" }}>
                  5:00 AM – 6:00 PM
                </p>
              </div>

              <div
                className="pt-5 space-y-1.5 relative"
                style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}
              >
                <p className="text-white/40 text-xs uppercase tracking-wider">Address</p>
                <p className="text-white/75 text-sm leading-relaxed">
                  Plaza Drive A. Mabini St. (21st),<br />West Rembo, Taguig City
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ContactCTA;