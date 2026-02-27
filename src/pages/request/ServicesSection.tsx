import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import serviceClearance from "../../assets/service-clearance.png";
import serviceRegistration from "../../assets/service-business.png";
import serviceBusiness from "../../assets/service-registration.png";

const services = [
  {
    image: serviceRegistration,
    title: "Resident Registration",
    description:
      "Register as a resident of Barangay West Rembo to access community services, programs, and benefits. Our registration process is simple and efficient.",
    href: "/services/resident-registration",
    number: "01",
  },
  {
    image: serviceClearance,
    title: "Barangay Clearance",
    description:
      "Apply for barangay clearance for employment, travel, and other official purposes. Fast processing with online tracking available.",
    href: "/services/barangay-clearance",
    number: "02",
  },
  {
    image: serviceBusiness,
    title: "Business Clearance",
    description:
      "Obtain business permits and clearances to operate legally within our barangay. We support local entrepreneurs with streamlined processing.",
    href: "/services/business-clearance",
    number: "03",
  },
  {
    image: serviceBusiness,
    title: "Building Clearance",
    description:
      "Obtain building permits and clearances to ensure compliance with local regulations. We support property owners with streamlined processing.",
    href: "/services/building-clearance",
    number: "04",
  },
];

const ServicesSection = () => {
  return (
    <section className="py-16 md:py-28 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">

        {/* Section Header */}
        <div className="text-center mb-16 sm:mb-20">
          {/* Eyebrow — matches HeroSection + AboutSection */}
          <div className="inline-flex items-center gap-2 mb-5">
            <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: "#d45ea3" }}
            >
              Community Services
            </span>
            <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
          </div>

          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 leading-tight"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Services{" "}
            <span style={{ color: "#fa43ae" }}>We Offer</span>
          </h2>

          {/* Underline accent */}
          <div
            className="mx-auto mt-3 mb-5 rounded-full"
            style={{ width: 56, height: 3, backgroundColor: "#d45ea3" }}
          />

          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            Access essential barangay services online. We are committed to serving our community
            with efficiency, transparency, and care.
          </p>
        </div>

        {/* Services list */}
        <div className="space-y-16 md:space-y-24">
          {services.map((service, index) => (
            <div
              key={service.title}
              className={`flex flex-col ${
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              } items-center gap-8 md:gap-16`}
            >
              {/* Image */}
              <div className="w-full md:w-5/12 flex-shrink-0">
                <div className="relative overflow-hidden rounded-2xl shadow-lg group">
                  {/* Number badge */}
                  {/* <div
                    className="absolute top-4 left-4 z-10 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black"
                    style={{
                      backgroundColor: "#d45ea3",
                      color: "#fff",
                      fontFamily: "'Georgia', serif",
                      boxShadow: "0 4px 12px rgba(212,94,163,0.4)",
                    }}
                  >
                    {service.number}
                  </div> */}

                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-64 md:h-72 object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Pink tint overlay on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(212,94,163,0.25) 0%, transparent 60%)",
                    }}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="w-full md:w-7/12 space-y-5">
                {/* Ghost watermark number */}
                <span
                  className="block text-7xl font-black leading-none select-none"
                  style={{ color: "#fa43ae12", fontFamily: "'Georgia', serif" }}
                >
                  #
                </span>

                <h3
                  className="text-2xl md:text-3xl font-bold text-foreground -mt-8 leading-snug"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  {service.title}
                </h3>

                {/* Pink accent line under title */}
                <div
                  className="rounded-full"
                  style={{ width: 40, height: 3, backgroundColor: "#d45ea3" }}
                />

                <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                  {service.description}
                </p>

                <Link
                  to={service.href}
                  className="inline-flex items-center gap-2 font-semibold text-sm transition-all duration-200 group/link hover:gap-3"
                  style={{ color: "#d45ea3" }}
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