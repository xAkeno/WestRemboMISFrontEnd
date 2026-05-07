import { ArrowRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import heroImage from "@/assets/hero-barangay.jpg";

const HeroSection = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Entrance animation trigger
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Scroll-driven parallax + title float-up
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Parallax values derived from scroll position
  const bgTranslateY = scrollY * 0.45;          // background drifts slower
  const contentTranslateY = -(scrollY * 0.55);  // content floats up faster
  const contentOpacity = Math.max(0, 1 - scrollY / 380);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* ── Parallax Background ─────────────────────────────────────── */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `translateY(${bgTranslateY}px)`,
          top: "-15%",
          bottom: "-15%",
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        {/* Multi-layer cinematic overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(175deg, rgba(8,18,50,0.72) 0%, rgba(15,42,94,0.62) 40%, rgba(60,10,35,0.55) 100%)",
          }}
        />
        {/* Vignette edges */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(5,10,30,0.65) 100%)",
          }}
        />
      </div>

      {/* ── Diagonal rule texture ──────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `repeating-linear-gradient(-45deg, #fff, #fff 1px, transparent 1px, transparent 20px)`,
        }}
      />

      {/* ── Animated horizontal scan line ─────────────────────────── */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          height: 1,
          background: "linear-gradient(to right, transparent, rgba(194,70,125,0.4), transparent)",
          animation: "scanline 6s ease-in-out infinite",
          top: "30%",
        }}
      />

      {/* ── Keyframe injection ────────────────────────────────────── */}
      <style>{`
        @keyframes scanline {
          0%   { top: 20%; opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { top: 80%; opacity: 0; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(36px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes widthIn {
          from { width: 0; }
          to   { width: 60px; }
        }
        @keyframes pulse-pink {
          0%, 100% { opacity: 0.6; transform: scaleX(1); }
          50%       { opacity: 1;   transform: scaleX(1.15); }
        }
        @keyframes bounce-down {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(6px); }
        }
      `}</style>

      {/* ── Content — floats up on scroll ─────────────────────────── */}
      <div
        ref={contentRef}
        className="relative z-10 container mx-auto px-4 sm:px-6 text-center pt-24 max-w-4xl will-change-transform"
        style={{
          transform: `translateY(${contentTranslateY}px)`,
          opacity: contentOpacity,
        }}
      >
        {/* Republic eyebrow */}
        <div
          className="inline-flex items-center gap-3 mb-8"
          style={{
            opacity: mounted ? 1 : 0,
            animation: mounted ? "fadeSlideUp 0.7s ease forwards" : "none",
            animationDelay: "0.05s",
          }}
        >
          <div
            style={{
              width: 32,
              height: 1,
              backgroundColor: "#c2467d",
              animation: mounted ? "pulse-pink 3s ease-in-out infinite" : "none",
            }}
          />
          <span
            className="text-xs font-bold uppercase tracking-[0.22em]"
            style={{ color: "#e8a0bf" }}
          >
            Republic of the Philippines · City of Taguig
          </span>
          <div
            style={{
              width: 32,
              height: 1,
              backgroundColor: "#c2467d",
              animation: mounted ? "pulse-pink 3s ease-in-out infinite 0.5s" : "none",
            }}
          />
        </div>

        {/* "Welcome to" line */}
        <div
          style={{
            opacity: mounted ? 1 : 0,
            animation: mounted ? "fadeSlideUp 0.75s ease forwards" : "none",
            animationDelay: "0.18s",
          }}
        >
          <h1
            className="font-bold text-white leading-tight mb-1"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
              letterSpacing: "-0.01em",
            }}
          >
            Welcome to
          </h1>
        </div>

        {/* Main title — largest, pink */}
        <div
          style={{
            opacity: mounted ? 1 : 0,
            animation: mounted ? "fadeSlideUp 0.8s ease forwards" : "none",
            animationDelay: "0.32s",
          }}
        >
          <h1
            className="font-extrabold leading-tight mb-2"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(2.4rem, 7vw, 4.5rem)",
              letterSpacing: "-0.02em",
              color: "#e8a0bf",
              textShadow: "0 0 80px rgba(194,70,125,0.35)",
            }}
          >
            Barangay West Rembo
          </h1>
        </div>

        {/* Animated pink divider */}
        <div
          className="mx-auto mb-7"
          style={{
            height: 2,
            backgroundColor: "#c2467d",
            opacity: mounted ? 1 : 0,
            animation: mounted ? "widthIn 0.8s ease forwards" : "none",
            animationDelay: "0.5s",
            width: 0, // starts at 0, animates to 60
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            opacity: mounted ? 1 : 0,
            animation: mounted ? "fadeSlideUp 0.8s ease forwards" : "none",
            animationDelay: "0.55s",
          }}
        >
          <p
            className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{
              color: "rgba(255,255,255,0.62)",
              fontFamily: "'Georgia', serif",
              fontStyle: "italic",
              fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
            }}
          >
            Official Digital Services Portal — Stay informed with announcements, events, and
            government services for the West Rembo community.
          </p>
        </div>

        {/* ── CTA Buttons ────────────────────────────────────────── */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          style={{
            opacity: mounted ? 1 : 0,
            animation: mounted ? "fadeSlideUp 0.85s ease forwards" : "none",
            animationDelay: "0.7s",
          }}
        >
          {/* Primary CTA */}
          <button
            onClick={() => navigate("/services")}
            className="inline-flex items-center justify-center gap-2 px-10 py-3.5 text-white text-sm font-semibold uppercase tracking-wider transition-all duration-300 group"
            style={{
              backgroundColor: "#c2467d",
              borderRadius: 2,
              letterSpacing: "0.08em",
              boxShadow: "0 6px 30px rgba(194,70,125,0.50)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#a33568";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 40px rgba(194,70,125,0.65)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#c2467d";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 30px rgba(194,70,125,0.50)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            Apply for Barangay Documents
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>

          {/* Secondary CTA */}
          <button
            onClick={() => navigate("/calendar")}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-white text-sm font-semibold uppercase tracking-wider transition-all duration-300"
            style={{
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.28)",
              backgroundColor: "rgba(255,255,255,0.06)",
              letterSpacing: "0.08em",
              backdropFilter: "blur(8px)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.14)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(194,70,125,0.60)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.06)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.28)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            Event Calendar
          </button>
        </div>

        {/* Scroll indicator */}
        <div
          className="mt-16 flex flex-col items-center gap-2"
          style={{
            opacity: mounted ? 1 : 0,
            animation: mounted ? "fadeIn 1s ease forwards" : "none",
            animationDelay: "1.1s",
          }}
        >
          <span
            className="text-[10px] uppercase tracking-[0.25em] font-semibold"
            style={{ color: "rgba(232,160,191,0.55)" }}
          >
            Scroll to explore
          </span>
          <ChevronDown
            className="w-5 h-5"
            style={{
              color: "#c2467d",
              animation: "bounce-down 1.8s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      {/* ── Bottom fade into page background ───────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      {/* ── Bottom-left official stamp badge ───────────────────────── */}
      <div
        className="absolute bottom-12 left-6 hidden lg:flex items-center gap-3 pointer-events-none"
        style={{
          opacity: mounted ? 1 : 0,
          animation: mounted ? "fadeIn 1s ease forwards" : "none",
          animationDelay: "1.3s",
        }}
      >
        {/* <div style={{ width: 1, height: 40, backgroundColor: "rgba(194,70,125,0.40)" }} />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(232,160,191,0.55)" }}>
            Official Portal
          </p>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">
            Barangay West Rembo · Taguig City
          </p>
        </div> */}
      </div>

      {/* ── Bottom-right form number ────────────────────────────────── */}
      {/* <div
        className="absolute bottom-12 right-6 hidden lg:block text-right pointer-events-none"
        style={{
          opacity: mounted ? 1 : 0,
          animation: mounted ? "fadeIn 1s ease forwards" : "none",
          animationDelay: "1.4s",
        }}
      >
        <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(194,70,125,0.40)" }}>
          Est. 1901
        </p>
        <p className="text-[10px] text-white/20 font-mono mt-0.5">BWR · 2025</p>
      </div> */}
    </section>
  );
};

export default HeroSection;