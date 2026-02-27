import { ArrowRight, MapPin, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const ContactCTA = () => {
  return (
    <section className="py-20 sm:py-28 bg-background relative overflow-hidden">
      {/* Subtle dot texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #d45ea3 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl relative">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          {/* Left — text */}
          <div className="flex-1 text-center lg:text-left">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 mb-5 justify-center lg:justify-start">
              <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
              <span
                className="text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: "#d45ea3" }}
              >
                Get in Touch
              </span>
              <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
            </div>

            <h2
              className="text-3xl sm:text-4xl font-bold text-foreground mb-3 leading-tight"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              Have a Question or{" "}
              <span style={{ color: "#fa43ae" }}>Concern?</span>
            </h2>

            <div
              className="mb-5 rounded-full mx-auto lg:mx-0"
              style={{ width: 56, height: 3, backgroundColor: "#d45ea3" }}
            />

            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              We're here to help. Reach out to the Barangay West Rembo office for any
              inquiries, concerns, or feedback. Our team is ready to assist you.
            </p>

            {/* Quick contact snippets */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              {[
                { icon: Phone, text: "(02) 8836 9731" },
                { icon: Mail, text: "westrembo@gmail.com" },
                { icon: MapPin, text: "West Rembo, Makati City" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#fce7f3" }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: "#d45ea3" }} />
                  </div>
                  <span className="text-sm text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>

            {/* CTA button */}
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:opacity-90 hover:scale-[1.02] hover:gap-3 group"
              style={{
                backgroundColor: "#d45ea3",
                boxShadow: "0 4px 20px rgba(212,94,163,0.30)",
              }}
            >
              Contact Us
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Right — decorative card */}
          <div className="flex-shrink-0 w-full max-w-sm lg:max-w-xs xl:max-w-sm">
            <div
              className="relative rounded-2xl overflow-hidden p-8 text-center"
              style={{
                background: "linear-gradient(135deg, #1a0a13 0%, #7c1d56 60%, #d45ea3 100%)",
                boxShadow: "0 8px 40px rgba(212,94,163,0.25)",
              }}
            >
              {/* Dot texture inside card */}
              <div
                className="absolute inset-0 opacity-[0.06] pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Icon */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 relative"
                style={{ backgroundColor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.20)" }}
              >
                <Mail className="w-8 h-8 text-white" strokeWidth={1.5} />
              </div>

              <h3
                className="text-xl font-bold text-white mb-2"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                Office Hours
              </h3>
              <div
                className="mx-auto mb-4 rounded-full"
                style={{ width: 36, height: 2, backgroundColor: "rgba(255,255,255,0.30)" }}
              />

              <div className="space-y-2 text-sm relative">
                <p className="text-white/80">Monday – Saturday</p>
                <p className="text-white font-bold text-lg">5:00 AM – 6:00 PM</p>
              </div>

              <div
                className="mt-6 pt-5 space-y-1.5 relative"
                style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
              >
                <p className="text-white/60 text-xs">Barangay Hall</p>
                <p className="text-white/80 text-sm font-medium leading-snug">
                  Plaza Drive A. Mabini St. (21st),<br />West Rembo, Makati City
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
