import { useState } from "react";
import Header from "./Header";

const tabs = ["Our Story", "Our Geography", "Our Mission", "Our Vision"];

const tabContent = {
  "Our Story": {
    title: "Our Story",
    content: [
      "WEST REMBO is one historic barangay. Though not much document can still support this claim, it is evidently concretized by the presence of the old Ermita de San Nicolas, the Church established by the Augustinian friars during the Spanish colonization of the Philippines. It is believed that the first settlers of this barangay were Chinese traders settled near the banks of Pasig River. This account is based on the writings of an anthropologist-historian who went around conducting his research and study during the American occupation of this country. The richness of our historical and cultural past may still yet to be accounted for but structural evidence, at the moment, would suffice to say that this particular locality started not by the name it is known today.",
      "When Fort Bonifacio was designated to be the home of the Philippine Army, B/Gen. Alfonso Arellano, the Commanding General of the Philippine Army at that time, relocated inhabitants of the nearby barrio to a well-situated area, which is now known as BARANGAY WEST REMBO. REMBO is actually an acronym for Riverside Enlisted Men's Barrio.",
      "Military authorities used to appoint the Barangay Leaders until 1982, when the Commission on Elections authorized the residents of Fort Bonifacio to elect their Barangay Leaders who came mostly from the Philippine Army. This paved the way to the escalation of a peaceful and progressive Barangays in Makati today.",
    ],
    hasImage: true,
  },
  "Our Geography": {
    title: "Geographic Information",
    sections: [
      {
        title: "Geographic Location",
        items: [
          "Longitude: 121° 3' 32\"",
          "Latitude: 14° 33' 44\"",
          "Land Area: 55.25 Hectares",
        ],
      },
      {
        title: "Barangay Boundaries",
        items: [
          "North: Pasig City",
          "South: Post Proper Northside",
          "East: East Rembo",
          "West: Portions of Cembo and Post Proper Northside",
        ],
      },
      {
        title: "Street Boundaries",
        items: [
          "North: Pasig River",
          "South: Kalayaan Avenue",
          "East: C-5",
          "West: Lawton Avenue",
        ],
      },
      {
        title: "Cluster Boundaries",
        items: [
          "North: Pasig River",
          "South: BGC, Taguig",
          "East: East Rembo",
          "West: Cembo",
        ],
      },
      {
        title: "Barangay Cluster",
        items: [
          "North: Pasig River",
          "South: Pembo",
          "East: East Rembo",
          "West: Cembo",
        ],
      },
      {
        title: "Additional Info",
        items: [
          "Number of Zones: 8 Zones",
          "Topography: Undulating tuffaceous plain",
          "Flood Intensity: None to low",
          "Earthquake Risk: Moderate to heavy",
          "Hydrology: Pasig River",
        ],
      },
    ],
    hasMap: true,
  },
  "Our Mission": {
    title: "Our Mission",
    content: [
      "To serve the residents of Barangay West Rembo with utmost dedication, transparency, and accountability. We commit to providing efficient public services, maintaining peace and order, and fostering a clean and sustainable community.",
      "We aim to empower every resident through accessible programs in education, livelihood, health, and social welfare, ensuring no one is left behind in our collective journey toward progress.",
      "Through collaborative governance and active citizen participation, we strive to build a community where every voice matters and every family thrives.",
    ],
  },
  "Our Vision": {
    title: "Our Vision",
    content: [
      "A progressive, peaceful, and self-sufficient Barangay West Rembo where residents enjoy a high quality of life, sustainable development, and equal opportunities for growth and prosperity.",
      "We envision a community united by shared values of respect, integrity, and bayanihan spirit—where families are safe, children are educated, and the elderly are cared for.",
      "By 2030, Barangay West Rembo shall be recognized as a model barangay in Makati City, known for its innovative programs, engaged citizenry, and resilient community spirit.",
    ],
  },
};

const AboutUsSection = () => {
  const [activeTab, setActiveTab] = useState("Our Story");

  const renderContent = () => {
    const data = tabContent[activeTab as keyof typeof tabContent];

    if (activeTab === "Our Geography" && "sections" in data) {
      return (
        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          {/* Map */}
          <div className="lg:w-1/2">
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid #f9a8d4", boxShadow: "0 4px 20px rgba(212,94,163,0.10)" }}
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.5!2d121.056!3d14.561!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c8f0a0000001%3A0x1!2sWest%20Rembo%2C%20Makati!5e0!3m2!1sen!2sph!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "320px", display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="West Rembo Map"
              />
            </div>
          </div>

          {/* Geography Details */}
          <div className="lg:w-1/2 grid sm:grid-cols-2 gap-5">
            {data.sections.map((section) => (
              <div
                key={section.title}
                className="bg-card rounded-xl p-4 border border-border"
                style={{ borderLeftWidth: 3, borderLeftColor: "#d45ea3" }}
              >
                <h4
                  className="font-bold text-foreground mb-2 text-sm"
                  style={{ fontFamily: "'Georgia', serif", color: "#d45ea3" }}
                >
                  {section.title}
                </h4>
                <ul className="space-y-1">
                  {section.items.map((item, idx) => (
                    <li key={idx} className="text-muted-foreground text-xs flex gap-1.5 items-start">
                      <span style={{ color: "#d45ea3" }}>·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if ("content" in data) {
      const hasImage = "hasImage" in data && data.hasImage;
      return (
        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          {hasImage && (
            <div className="lg:w-1/2">
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid #f9a8d4", boxShadow: "0 4px 20px rgba(212,94,163,0.10)" }}
              >
                <img
                  src="https://images.unsplash.com/photo-1555899434-94d1368aa7af?w=600&h=400&fit=crop"
                  alt="Barangay West Rembo Welcome Sign"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          )}

          <div className={hasImage ? "lg:w-1/2" : "w-full max-w-4xl mx-auto"}>
            <h3
              className="text-2xl font-bold text-foreground mb-5"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              {data.title}
            </h3>
            <ul className="space-y-4">
              {data.content.map((paragraph, idx) => (
                <li key={idx} className="text-muted-foreground text-sm leading-relaxed flex gap-3">
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: "#d45ea3" }}
                  />
                  <span>{paragraph}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <section id="about" className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl">

        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-5">
            <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: "#d45ea3" }}
            >
              Barangay West Rembo
            </span>
            <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
          </div>

          <h2
            className="text-3xl sm:text-4xl font-bold text-foreground mb-3"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            About{" "}
            <span style={{ color: "#fa43ae" }}>Us</span>
          </h2>

          <div
            className="mx-auto mt-3 mb-6 rounded-full"
            style={{ width: 56, height: 3, backgroundColor: "#d45ea3" }}
          />

          <p className="text-muted-foreground max-w-4xl mx-auto text-sm sm:text-base leading-relaxed">
            BARANGAY WEST REMBO is located in the District 2 of Makati and situated at the Eastside Cluster along with barangays East Rembo, Comembo, Pembo and Rizal. Based on the 2015 Census of Population conducted by the Philippine Statistics Authority, West Rembo has a total population of 29,826. Its population density is fifty-four persons per 1,000 square meters. It has a total land area of 552,500 square meters and a predominantly residential area. Barangay West Rembo houses several institutional properties such as the Makati Parks and Garden and University of Makati. At present, the leadership of the City and Barangay West Rembo attained multiple development milestones. Public schools were established within the barangay such as, The University of Makati, Fort Bonifacio High School, Fort Bonifacio Elementary School and West Rembo Elementary School.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10 ">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200"
              style={
                activeTab === tab
                  ? {
                      backgroundColor: "#d45ea3",
                      color: "#fff",
                      boxShadow: "0 4px 14px rgba(212,94,163,0.28)",
                      transform: "scale(1.05)",
                    }
                  : {
                      backgroundColor: "#fff",
                      color: "#607a86",
                      border: "1px solid #e8eff2",
                    }
              }
              onMouseEnter={(e) => {
                if (activeTab !== tab) {
                  (e.currentTarget as HTMLElement).style.borderColor = "#f9a8d4";
                  (e.currentTarget as HTMLElement).style.color = "#d45ea3";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab) {
                  (e.currentTarget as HTMLElement).style.borderColor = "#e8eff2";
                  (e.currentTarget as HTMLElement).style.color = "#607a86";
                }
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content card */}
        <div
          className="bg-card rounded-2xl p-6 sm:p-8 border border-border"
          style={{ boxShadow: "0 4px 24px rgba(212,94,163,0.08)" }}
        >
          {renderContent()}
        </div>
      </div>
    </section>
  );
};

export default AboutUsSection;