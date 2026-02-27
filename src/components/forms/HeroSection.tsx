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
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />

      {/* Overlay — dark teal tint to match civic palette */}
      <div
        className="absolute inset-0 bg-gray-900/50"
      />

      {/* Subtle dot texture */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Content — matches original structure exactly */}
      <div className="relative z-10 container mx-auto px-4 text-center pt-20">

        {/* Small eyebrow label */}
        <div className="inline-flex items-center gap-2 mb-6 animate-fade-in">
          <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
          <span
            className="text-md font-bold uppercase tracking-[0.2em]"
            style={{ color: "#ff3bad" }}
          >
            Official Barangay Portal
          </span>
          <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
        </div>

        {/* Heading */}
        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 animate-fade-in leading-tight"
          style={{ fontFamily: "'Georgia', serif", letterSpacing: "-0.01em" }}
        >
          Welcome to
        </h1>
        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in leading-tight"
          style={{
            fontFamily: "'Georgia', serif",
            letterSpacing: "-0.01em",
            color: "#fa43ae",
          }}
        >
          Barangay West Rembo
        </h1>

        {/* Underline accent */}
        <div
          className="mx-auto mb-8 rounded-full animate-fade-in"
          style={{
            width: 64,
            height: 3,
            backgroundColor: "#d45ea3",
            animationDelay: "0.05s",
          }}
        />

        {/* Paragraph */}
        <p
          className="text-lg md:text-xl max-w-3xl mx-auto mb-10 animate-fade-in leading-relaxed"
          style={{ color: "rgba(255,255,255,0.72)", animationDelay: "0.1s" }}
        >
          Stay informed with official announcements, upcoming events, and important updates to help
          keep the West Rembo community safe, connected, and thriving.
        </p>

        {/* Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <Button
            size="lg"
            className="font-semibold px-8 h-12 rounded-xl transition-all duration-200 hover:scale-105"
            onClick={() => {navigate("/contact")}}
            style={{
              backgroundColor: "#d45ea3",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(42,125,111,0.35)",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#d43d95")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#d45ea3")}
          >
            Calendar of Activity
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => {navigate("/aboutus")}}
            className="font-semibold px-8 h-12 rounded-xl transition-all duration-200 hover:scale-105"
            style={{
              borderColor: "rgba(255,255,255,0.35)",
              color: "#fff",
              backgroundColor: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(8px)",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.15)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)")}
          >
            Learn about us
          </Button>
        </div>
      </div>

      {/* Bottom fade into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;