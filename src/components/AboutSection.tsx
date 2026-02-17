import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";





const AboutSection = () => {
  const { t, i18n } = useTranslation('home');
  const [, forceUpdate] = useState(0);
  
  // Force component to re-render when language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      forceUpdate(prev => prev + 1);
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);


  const features = [
    {
      number: "01",
      title: t('features.communityStuff.title'),
      description: t('features.communityStuff.description'),
    },
    {
      number: "02",
      title: t('features.calendarEvent.title'),
      description: t('features.calendarEvent.description'),
    },
    {
      number: "03",
      title: t('features.emergencyEvents.title'),
      description: t('features.emergencyEvents.description'),
    },
  ];


  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            {t('about.titles')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('about.descriptions')}
          </p>
          </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.number}
              className="bg-card rounded-lg p-8 shadow-sm border border-border hover:shadow-md transition-shadow"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <span className="text-4xl font-heading font-bold text-gold mb-4 block">
                {feature.number}
              </span>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;