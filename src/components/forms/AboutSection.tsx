const features = [
  {
    number: "01",
    title: "Community Announcements",
    description:
      "Stay updated with the latest news, government notices, and barangay advisories relevant to West Rembo residents.",
  },
  {
    number: "02",
    title: "Event Calendar",
    description:
      "Browse upcoming events, meetings, and activities in the community — so you never miss what's happening in West Rembo.",
  },
  {
    number: "03",
    title: "Emergency Info & Contacts",
    description:
      "Access emergency hotlines, health center contacts, and safety tips to help you stay ready during urgent situations in West Rembo.",
  },
];

const AboutSection = () => {
  return (
    <section id="about" className="py-20 sm:py-28 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">

        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-3 mb-4">
            <div style={{ width: 32, height: 1, backgroundColor: "#c2467d" }} />
            <span
              className="text-xs font-bold uppercase tracking-[0.20em]"
              style={{ color: "#c2467d" }}
            >
              Barangay West Rembo
            </span>
            <div style={{ width: 32, height: 1, backgroundColor: "#c2467d" }} />
          </div>

          <h2
            className="font-bold text-foreground mb-3"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "clamp(1.6rem, 3vw, 2.25rem)",
            }}
          >
            About This{" "}
            <span style={{ color: "#c2467d" }}>Portal</span>
          </h2>

          <div style={{ width: 48, height: 2, backgroundColor: "#c2467d", margin: "12px auto 20px" }} />

          <p
            className="text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            style={{ fontSize: "0.95rem" }}
          >
            This website is the official online channel of Barangay West Rembo, dedicated to
            sharing announcements, events, and updates. It serves as an information hub to keep
            residents connected, informed, and served.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.number}
              className="group relative bg-card border border-border p-8 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              style={{ borderRadius: 2 }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#c2467d";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "";
              }}
            >
              {/* Top accent — always pink, grows to full on hover */}
              <div
                className="absolute top-0 left-0 w-full transition-all duration-300"
                style={{ height: 2, backgroundColor: "#c2467d", opacity: 0.30 }}
              />
              <div
                className="absolute top-0 left-0 transition-all duration-300 group-hover:w-full"
                style={{ height: 2, backgroundColor: "#c2467d", width: "40px" }}
              />

              {/* Number */}
              <span
                className="block font-bold mb-5"
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "2.5rem",
                  color: "#c2467d",
                  lineHeight: 1,
                  opacity: 0.90,
                }}
              >
                {feature.number}
              </span>

              <h3
                className="font-bold text-foreground mb-3"
                style={{ fontFamily: "'Georgia', serif", fontSize: "1.05rem" }}
              >
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