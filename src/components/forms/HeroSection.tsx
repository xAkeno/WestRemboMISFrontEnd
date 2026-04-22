import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-barangay.jpg";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${heroImage})` }}
      />

      {/* Overlay — deep navy tint for official/government feel */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(160deg, rgba(10, 25, 60, 0.53) 0%, rgba(15, 43, 94, 0.56) 50%, rgba(15, 43, 94, 0.53)" }}
      />

      {/* Subtle diagonal stripe texture */}
      {/* <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(-45deg, #fff, #fff 1px, transparent 1px, transparent 18px)`,
        }}
      /> */}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 text-center pt-24 max-w-4xl">

        {/* Republic branding eyebrow */}
        <div className="inline-flex items-center gap-3 mb-8">
          <div style={{ width: 32, height: 1, backgroundColor: "#c2467d" }} />
          <span
            className="text-xs font-bold uppercase tracking-[0.22em]"
            style={{ color: "#e8a0bf", letterSpacing: "0.22em" }}
          >
            Republic of the Philippines · City of Taguig
          </span>
          <div style={{ width: 32, height: 1, backgroundColor: "#c2467d" }} />
        </div>

        {/* Main heading */}
        <h1
          className="font-bold text-white leading-tight mb-2"
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: "clamp(2rem, 5vw, 3.25rem)",
            letterSpacing: "-0.01em",
          }}
        >
          Welcome to
        </h1>
        <h1
          className="font-extrabold leading-tight mb-6"
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: "clamp(2.2rem, 6vw, 3.75rem)",
            letterSpacing: "-0.01em",
            color: "#e8a0bf",
          }}
        >
          Barangay West Rembo
        </h1>

        {/* Thin divider */}
        <div
          className="mx-auto mb-8"
          style={{ width: 60, height: 2, backgroundColor: "#c2467d" }}
        />

        {/* Subtitle */}
        <p
          className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{
            color: "rgba(255,255,255,0.65)",
            fontFamily: "'Georgia', serif",
            fontStyle: "italic",
            fontSize: "clamp(1rem, 2vw, 1.15rem)",
          }}
        >
          Official Digital Services Portal — Stay informed with announcements, events, and
          government services for the West Rembo community.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">

          {/* 🔥 PRIMARY CTA — APPLY */}
          <button
            onClick={() => navigate("/services")}
            className="inline-flex items-center justify-center gap-2 px-10 py-3 text-white text-sm font-semibold uppercase tracking-wider transition-all duration-200"
            style={{
              backgroundColor: "#c2467d",
              borderRadius: 2,
              letterSpacing: "0.08em",
              boxShadow: "0 6px 25px rgba(194,70,125,0.45)",
            }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#a33568"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#c2467d"}
          >
            Apply for a Barangay Documents
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Secondary */}
          <button
            onClick={() => navigate("/calendar")}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-white text-sm font-semibold uppercase tracking-wider transition-all duration-200"
            style={{
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.30)",
              backgroundColor: "rgba(255,255,255,0.06)",
              letterSpacing: "0.08em",
            }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.12)"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.06)"}
          >
            Event Calendar
          </button>


        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;