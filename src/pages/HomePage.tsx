import Header from "@/components/forms/Header";
import HeroSection from "@/components/forms/HeroSection";
import RequestFormSection from "@/components/forms/RequestFormSection";
import OfficialsSection from "@/components/forms/OfficialsSection";
import Footer from "@/components/forms/Footer";
import AboutSection from "@/components/AboutSection";
import { useEffect, useState } from "react";
import ServicesSection from "./request/ServicesSection";
import Calendar from "./Calendar";
import ContactCTA from "@/components/ContactCTA";
const HomePage = () => {

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const el = document.getElementById(id);

      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location]);

  const [showTopBtn, setShowTopBtn] = useState(false);

  // Show button only after scrolling 300px
  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <AboutSection />
        <div>
          <ServicesSection />
        </div>
        <OfficialsSection />
        <div>
          <Calendar />
        </div>
        <ContactCTA />
      </main>
      <Footer />
      {showTopBtn && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-pink-600 text-white w-12 h-12 flex items-center justify-center rounded-full shadow-lg hover:bg-pink-700 transition-colors duration-200 z-50"
        >
          ↑
        </button>
      )}
    </div>
  );
};

export default HomePage;
