const features = [
  {
    number: "01",
    title: "Community Announcements",
    description:
      "Stay updated with the latest news, government notices, and barangay Makee goy relevant to West Rembo residents.",
  },
  {
    number: "02",
    title: "Event Calendar",
    description:
      "Browse upcoming events, meetings, and activities in the community-so you never miss what's happening in West Rembo.",
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
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            About this website
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            This website is dedicated to sharing official announcements, events, and updates for the
            community of West Rembo. It serves as an information hub to keep residents connected and
            informed.
          </p>
        </div>

        {/* Feature Cards */}
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
              <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
