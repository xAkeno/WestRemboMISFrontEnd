import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import serviceClearance from "../../assets/service-clearance.png";
import serviceRegistration from "../../assets/service-business.png";
import serviceBusiness from "../../assets/service-registration.png";
import { use } from "i18next";
import { title } from "process";




const ServicesSection = () => {
  const {t} = useTranslation('home');

  const services = [
  {
    image: serviceRegistration,
    title: t('services.firstBox.title'),
    description: t('services.firstBox.description'),
    href: "/services/resident-registration",
  },
  {
    image: serviceClearance,
    title: t('services.secondBox.title'),
    description: t('services.secondBox.description'),
    href: "/services/barangay-clearance",
  },
  {
    image: serviceBusiness,
    title: t('services.thirdBox.title'),
    description: t('services.thirdBox.description'),
    href: "/services/business-clearance",
  },
];


  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('services.topBox.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {t('services.topBox.description')}
          </p>
        </div>
        
        <div className="space-y-16 md:space-y-24 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <div 
              key={service.title}
              className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-12`}
            >
              {/* Image */}
              <div className="w-full md:w-5/12 flex-shrink-0">
                <div className="relative overflow-hidden rounded-2xl shadow-lg group">
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-64 md:h-72 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
              
              {/* Content */}
              <div className="w-full md:w-7/12 space-y-4">
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                  {service.title}
                </h3>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                  {service.description}
                </p>
                <Link 
                  to={service.href}
                  className="inline-flex items-center gap-2 text-primary font-medium hover:underline underline-offset-4 transition-all group/link"
                >
                  Learn more
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
