import { useState } from "react";
import { Layout } from "../Layout";
import Header from "./Header";
import {useTranslation} from "react-i18next";



const AboutUsSection = () => {
  const { t, i18n } = useTranslation("about");
 

  const tabs = [
    {key: "Our Story", label: t('tabs.ourStory')},
    {key: "Our Geography", label: t('tabs.ourGeography')},
    {key: "Our Mission", label: t('tabs.ourMission')},
    {key: "Our Vision", label: t('tabs.ourVision')},
  ];

  const tabContent = {
    "Our Story": {
      title: t('story.title'),
      content: [
        t('story.content'),
        t('story.content2'),
        t('story.content3'),
      ],
      hasImage: true,
    },
    "Our Geography": {
      title: "Geographic Information",
      sections: [
        {
            title: t('geo.subHead.title'),
            items: [
                t('geo.wrapper1.con'),
                t('geo.wrapper1.con2'),
                t('geo.wrapper1.con3'),
            ],
        },
        {
            title: t('geo.wrapper2.title'),
            items: [
                t('geo.wrapper2.con'),
                t('geo.wrapper2.con2'),
                t('geo.wrapper2.con3'),
                t('geo.wrapper2.con4'),
            ],
        },
        {
            title: t('geo.wrapper3.title'),
            items: [
                t('geo.wrapper3.con'),
                t('geo.wrapper3.con2'),
                t('geo.wrapper3.con3'),
                t('geo.wrapper3.con4'),
            ],
        },
        {
            title: t('geo.wrapper4.title'),
            items: [
                t('geo.wrapper4.con'),
                t('geo.wrapper4.con2'),
                t('geo.wrapper4.con3'),
                t('geo.wrapper4.con4'),
            ],
        },
        {
            title: t('geo.wrapper5.title'),
            items: [
                t('geo.wrapper5.con'),
                t('geo.wrapper5.con2'),
                t('geo.wrapper5.con3'),
                t('geo.wrapper5.con4'),
            ],
        },
        {
            title: t('geo.wrapper6.title'),
            items: [
                t('geo.wrapper6.con'),
                t('geo.wrapper6.con2'),
                t('geo.wrapper6.con3'),
                t('geo.wrapper6.con4'),
                t('geo.wrapper6.con5'),
            ],
        },
      ],
      hasMap: true,
    },
    "Our Mission": {
      title: t('geo.mission.title'),
      content: [
      t('geo.mission.sub'),
      t('geo.mission.sub2'),
      t('geo.mission.sub3'),
      ]
    },
    "Our Vision": {
      title: t('geo.vision.title'),
      content: [
      t('geo.vision.sub'),
      t('geo.vision.sub2'),
      t('geo.vision.sub3'),
      ],
    },
  };  

  const [activeTab, setActiveTab] = useState("Our Story");

  const renderContent = () => {
    const data = tabContent[activeTab as keyof typeof tabContent];

    if (activeTab === "Our Geography" && "sections" in data) {
      return (
        <div className="flex flex-col lg:flex-row gap-8 mt-8">
          {/* Map placeholder */}
          <div className="lg:w-1/2">
            <div className="bg-navy-dark/50 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.5!2d121.056!3d14.561!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c8f0a0000001%3A0x1!2sWest%20Rembo%2C%20Makati!5e0!3m2!1sen!2sph!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "300px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="West Rembo Map"
              />
            </div>
          </div>

          {/* Geography Details */}
          <div className="lg:w-1/2 grid sm:grid-cols-2 gap-6">
            {data.sections.map((section) => (
              <div key={section.title}>
                <h4 className="font-heading font-bold text-foreground mb-2">
                  {section.title}
                </h4>
                <ul className="space-y-1">
                  {section.items.map((item, idx) => (
                    <li key={idx} className="text-foreground/80 text-sm">
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
          {/* Image for Our Story */}
          {hasImage && (
            <div className="lg:w-1/2">
              <div className="bg-navy-dark/30 rounded-lg overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1555899434-94d1368aa7af?w=600&h=400&fit=crop"
                  alt="Barangay West Rembo Welcome Sign"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          )}

          {/* Text Content */}
          <div className={hasImage ? "lg:w-1/2" : "w-full max-w-4xl mx-auto"}>
            <h3 className="text-2xl font-heading font-bold text-foreground mb-4">
              {data.title}
            </h3>
            <ul className="space-y-4">
              {data.content.map((paragraph, idx) => (
                <li key={idx} className="text-foreground/80 text-sm leading-relaxed flex gap-2">
                  <span className="text-foreground/60">•</span>
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
    <section id="about" className="py-20 bg-slateBlue">
      <Header />
      <div className="container mx-auto py-16 px-4">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-6">
            {t('header.title')}
          </h2>
          <p className="text-foreground/80 max-w-4xl mx-auto leading-relaxed">
            {t('header.desc')}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-6 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-sm font-medium transition-all pb-1 ${
                activeTab === tab.key
                  ? "text-primary border-b-2 border-primary"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {renderContent()}
      </div>
    </section>  
  );
};

export default AboutUsSection;
