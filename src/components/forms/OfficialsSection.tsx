const captain = {
  name: "Roberto C. Dela Cruz",
  position: "PUNONG BARANGAY",
  committee: "Barangay Captain",
  image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face",
};

const officials = [
  {
    name: "Leonard J. Mercado",
    position: "KAGAWAD",
    committee: "Youth and Sports Development Committee",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  },
  {
    name: "Clarisse H. Navarro",
    position: "KAGAWAD",
    committee: "Health and Sanitation Committee",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
  },
  {
    name: "Rowena G. Santos",
    position: "KAGAWAD",
    committee: "Livelihood and Economic Development",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
  },
  {
    name: "Joshua L. Ferrer",
    position: "KAGAWAD",
    committee: "Disaster Preparedness and Emergency Response",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
  },
  {
    name: "Diana V. Aquino",
    position: "KAGAWAD",
    committee: "Peace and Order Committee",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
  },
  {
    name: "Geraldine M. Roldan",
    position: "KAGAWAD",
    committee: "Education, Culture and Gender Equality",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
  },
  {
    name: "Marco Elias D. Trinidad",
    position: "INGAT-YAMAN",
    committee: "Barangay Budget and Fiscal Management",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
  },
  {
    name: "Kristine Joy P. Lacson",
    position: "KALIHIM",
    committee: "Community Records and Documentation",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face",
  },
  {
    name: "Benjamin A. Reyes",
    position: "KAGAWAD",
    committee: "Environmental Protection and Cleanliness",
    image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&h=200&fit=crop&crop=face",
  },
];

const positionBadge: Record<string, { bg: string; text: string }> = {
  "PUNONG BARANGAY": { bg: "#fce7f3", text: "#be185d" },
  KAGAWAD:           { bg: "#fdf2f8", text: "#d45ea3" },
  "INGAT-YAMAN":     { bg: "#fce7f3", text: "#9d174d" },
  KALIHIM:           { bg: "#fdf2f8", text: "#a21caf" },
};

const OfficialsSection = () => {
  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">

        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 mb-5">
            <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: "#d45ea3" }}
            >
              Term 2023 – 2026
            </span>
            <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
          </div>

          <h2
            className="text-3xl sm:text-4xl font-bold text-foreground mb-3 leading-tight"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Elected{" "}
            <span style={{ color: "#fa43ae" }}>Officials</span>
          </h2>

          <div
            className="mx-auto mt-3 mb-5 rounded-full"
            style={{ width: 56, height: 3, backgroundColor: "#d45ea3" }}
          />

          <p className="text-muted-foreground max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
            Meet the dedicated public servants of Barangay West Rembo committed to serving every resident.
          </p>
        </div>

        {/* Barangay Captain — featured card */}
        <div className="flex justify-center mb-14">
          <div
            className="relative flex flex-col sm:flex-row items-center gap-6 bg-card rounded-2xl p-6 sm:p-8 border w-full max-w-md transition-shadow duration-300 hover:shadow-xl"
            style={{ borderColor: "#f9a8d4", boxShadow: "0 2px 20px rgba(212,94,163,0.10)" }}
          >
            {/* Punong Barangay badge */}
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 sm:-top-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
              style={{ backgroundColor: "#d45ea3", color: "#fff" }}
            >
              Punong Barangay
            </div>

            {/* Photo */}
            <div
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden flex-shrink-0"
              style={{ border: "3px solid #d45ea3", boxShadow: "0 0 0 5px #fce7f3" }}
            >
              <img
                src={captain.image}
                alt={captain.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(captain.name)}&size=200&background=d45ea3&color=fff`;
                }}
              />
            </div>

            {/* Info */}
            <div className="text-center sm:text-left">
              <h3
                className="text-xl font-bold text-foreground mb-1"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                {captain.name}
              </h3>
              <p
                className="text-sm font-bold uppercase tracking-wider mb-1"
                style={{ color: "#d45ea3" }}
              >
                {captain.position}
              </p>
              <p className="text-sm text-muted-foreground">{captain.committee}</p>
              <div
                className="mt-3 h-0.5 w-10 rounded-full mx-auto sm:mx-0"
                style={{ backgroundColor: "#d45ea3" }}
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px flex-1 bg-border" />
          <span
            className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Council Members
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Officials Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
          {officials.map((official, index) => {
            const badge = positionBadge[official.position] ?? { bg: "#fdf2f8", text: "#d45ea3" };
            return (
              <div
                key={index}
                className="group flex flex-col items-center text-center bg-card rounded-2xl p-5 sm:p-6 border border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ "--hover-shadow": "0 8px 30px rgba(212,94,163,0.12)" } as React.CSSProperties}
              >
                {/* Photo */}
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-4 transition-transform duration-300 group-hover:scale-105"
                  style={{ border: "2px solid #f9a8d4" }}
                >
                  <img
                    src={official.image}
                    alt={official.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(official.name)}&size=200&background=d45ea3&color=fff`;
                    }}
                  />
                </div>

                {/* Name */}
                <h3
                  className="text-sm sm:text-base font-bold text-foreground mb-2 leading-snug"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  {official.name}
                </h3>

                {/* Position badge */}
                <span
                  className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-2"
                  style={{ backgroundColor: badge.bg, color: badge.text }}
                >
                  {official.position}
                </span>

                {/* Committee */}
                <p className="text-xs text-muted-foreground leading-snug">
                  {official.committee}
                </p>

                {/* Bottom accent on hover */}
                <div
                  className="mt-3 h-0.5 w-0 group-hover:w-8 rounded-full transition-all duration-300"
                  style={{ backgroundColor: "#d45ea3" }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default OfficialsSection;