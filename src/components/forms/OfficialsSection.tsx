import { useTranslation } from "react-i18next";


const OfficialsSection = () => {
  
  const { t } = useTranslation('home');
  
    const captain = {
      name: t('barangayStuff.barangayCap.name'),
      position: t('barangayStuff.barangayCap.position'),
      committee: t('barangayStuff.barangayCap.committee'),
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face",
    };

    const officials = [
      {
        name: t('barangayStuff.barangayKagawadfirst.name'),
        position: t('barangayStuff.barangayKagawadfirst.position'),
        committee: t('barangayStuff.barangayKagawadfirst.committee'),
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
      },
      {
        name: t('barangayStuff.barangayKagawadsecond.name'),
        position: t('barangayStuff.barangayKagawadsecond.position'),
        committee: t('barangayStuff.barangayKagawadsecond.committee'),
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
      },
      {
        name: t('barangayStuff.barangayKagawadthird.name'),
        position: t('barangayStuff.barangayKagawadthird.position'),
        committee: t('barangayStuff.barangayKagawadthird.committee'),
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
      },
      {
        name: t('barangayStuff.barangayKagawadfourth.name'),
        position: t('barangayStuff.barangayKagawadfourth.position'),
        committee: t('barangayStuff.barangayKagawadfourth.committee'),
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
      },
      {
        name: t('barangayStuff.barangayKagawadfifth.name'),
        position: t('barangayStuff.barangayKagawadfifth.position'),
        committee: t('barangayStuff.barangayKagawadfifth.committee'),
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
      },
      {
        name: t('barangayStuff.barangayKagawadsixth.name'),
        position: t('barangayStuff.barangayKagawadsixth.position'),
        committee: t('barangayStuff.barangayKagawadsixth.committee'),
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
      },
      {
        name: t('barangayStuff.barangayKagawadseventh.name'),
        position: t('barangayStuff.barangayKagawadseventh.position'),
        committee: t('barangayStuff.barangayKagawadseventh.committee'),
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
      },
      {
        name: t('barangayStuff.barangayKagawadeighth.name'),
        position: t('barangayStuff.barangayKagawadeighth.position'),
        committee: t('barangayStuff.barangayKagawadeighth.committee'),
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face",
      },
      {
        name: t('barangayStuff.barangayKagawadninth.name'),
        position: t('barangayStuff.barangayKagawadninth.position'),
        committee: t('barangayStuff.barangayKagawadninth.committee'),
        image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&h=200&fit=crop&crop=face",
      },
    ];
  
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-4">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
            {t('barangayStuff.head.title')}
          </h2>
        </div>
        
        <div className="w-full max-w-4xl mx-auto h-px bg-border mb-12" />

        {/* Barangay Captain - Centered on Top */}
        <div className="text-center mb-16">
          <div className="w-36 h-36 mx-auto mb-4 rounded-sm overflow-hidden bg-muted">
            <img
              src={captain.image}
              alt={captain.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(captain.name)}&size=200&background=1e3a5f&color=fff`;
              }}
            />
          </div>
          <h3 className="text-xl font-medium text-primary mb-1">{captain.name}</h3>
          <p className="text-base font-semibold text-foreground mb-1">{captain.position}</p>
          <p className="text-sm text-primary">{captain.committee}</p>
        </div>

        {/* Officials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-10 max-w-5xl mx-auto">
          {officials.map((official, index) => (
            <div key={index} className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 rounded-sm overflow-hidden bg-muted">
                <img
                  src={official.image}
                  alt={official.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(official.name)}&size=200&background=1e3a5f&color=fff`;
                  }}
                />
              </div>
              <h3 className="text-lg font-medium text-primary mb-1">{official.name}</h3>
              <p className="text-sm font-semibold text-foreground mb-1">{official.position}</p>
              <p className="text-sm text-primary">{official.committee}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OfficialsSection;
