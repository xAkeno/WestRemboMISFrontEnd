import { useEffect, useState } from "react";
import Header from "@/components/forms/Header";
import HeroSection from "@/components/forms/HeroSection";
import RequestFormSection from "@/components/forms/RequestFormSection";
import OfficialsSection from "@/components/forms/OfficialsSection";
import Footer from "@/components/forms/Footer";
import AboutSection from "@/components/AboutSection";
import ServicesSection from "./request/ServicesSection";
import Calendar from "./Calendar";
import ContactCTA from "@/components/ContactCTA";

const HomePage = () => {
  const [showTopBtn, setShowTopBtn] = useState(false);

  // Scroll to hash section
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [location]);

  // Show "scroll to top" button
  useEffect(() => {
    const handleScroll = () => setShowTopBtn(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // Load Chatbot script once
  useEffect(() => {
    if (!document.getElementById("chatbase-script")) {
      const script = document.createElement("script");
      script.src = "https://www.chatbase.co/embed.min.js";
      script.id = "chatbase-script";
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      <Header />
      <main>
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <OfficialsSection />
        <Calendar />
        <ContactCTA />
      </main>
      <Footer />

      {/* Scroll to top button */}
      {showTopBtn && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-pink-600 text-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg hover:bg-pink-700 transition-colors duration-200 z-50"
        >
          ↑
        </button>
      )}

      {/* Chatbot fixed button (optional) */}
      <div
        id="chatbot-widget"
        className="fixed bottom-24 right-8 z-50"
        style={{ width: 64, height: 64 }}
      />
    </div>
  );
};

export default HomePage;