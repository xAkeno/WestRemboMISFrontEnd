import { Megaphone, CalendarDays, PhoneCall } from "lucide-react";

const features = [
  {
    number: "01",
    icon: Megaphone,
    title: "Community Announcements",
    description:
      "Stay updated with the latest news, government notices, and barangay updates relevant to West Rembo residents.",
  },
  {
    number: "02",
    icon: CalendarDays,
    title: "Event Calendar",
    description:
      "Browse upcoming events, meetings, and activities in the community — so you never miss what's happening in West Rembo.",
  },
  {
    number: "03",
    icon: PhoneCall,
    title: "Emergency Info & Contacts",
    description:
      "Access emergency hotlines, health center contacts, and safety tips to help you stay ready during urgent situations in West Rembo.",
  },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-20 sm:py-28 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

        {/* Section Header */}
        <div className="text-center mb-14 sm:mb-16">
          {/* Eyebrow — same style as HeroSection */}
          <div className="inline-flex items-center gap-2 mb-5">
            <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: "#d45ea3" }}
            >
              About this Website
            </span>
            <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
          </div>

          <h2
            className="text-3xl sm:text-4xl font-bold text-foreground mb-3 leading-tight"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Your Digital{" "}
            <span style={{ color: "#fa43ae" }}>Barangay Hub</span>
          </h2>

          {/* Underline accent */}
          <div
            className="mx-auto mt-3 mb-5 rounded-full"
            style={{ width: 56, height: 3, backgroundColor: "#d45ea3" }}
          />

          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            This website is dedicated to sharing official announcements, events, and updates for the
            community of West Rembo. It serves as an information hub to keep residents connected and
            informed.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.number}
                className="group relative bg-card rounded-2xl p-8 border border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Large watermark number */}
                <span
                  className="absolute -top-3 -right-1 text-8xl font-black select-none pointer-events-none leading-none"
                  style={{ color: "#fa43ae10" }}
                >
                  {feature.number}
                </span>

                {/* Left hover accent bar */}
                <div
                  className="absolute left-0 top-6 bottom-6 w-0 group-hover:w-1 rounded-r-full transition-all duration-300"
                  style={{ backgroundColor: "#d45ea3" }}
                />

                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: "#fa43ae18" }}
                >
                  <Icon className="w-6 h-6" style={{ color: "#d45ea3" }} strokeWidth={1.8} />
                </div>

                {/* Number */}
                <span
                  className="text-4xl font-black mb-3 block leading-none"
                  style={{ color: "#fa43ae", fontFamily: "'Georgia', serif" }}
                >
                  {feature.number}
                </span>

                <h3
                  className="text-lg font-bold text-foreground mb-3"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  {feature.title}
                </h3>

                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;