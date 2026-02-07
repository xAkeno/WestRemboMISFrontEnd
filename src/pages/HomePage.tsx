import Header from "@/components/forms/Header";
import HeroSection from "@/components/forms/HeroSection";
import RequestFormSection from "@/components/forms/RequestFormSection";
import OfficialsSection from "@/components/forms/OfficialsSection";
import Footer from "@/components/forms/Footer";
import AboutSection from "@/components/AboutSection";
import { useEffect } from "react";

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
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <AboutSection />
        <RequestFormSection />
        <OfficialsSection />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
