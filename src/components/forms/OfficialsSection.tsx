import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "@/components/ui/use-toast"; // your toast component

const API_BASE = `${import.meta.env.VITE_WEB_URL}/api`;

// Position badge colors
const positionBadge: Record<string, { bg: string; text: string; border: string }> = {
  "PUNONG BARANGAY": { bg: "#0f2a5e", text: "#fff", border: "#0f2a5e" },
  KAGAWAD: { bg: "#fdf5f8", text: "#c2467d", border: "#f0c4d8" },
  "INGAT-YAMAN": { bg: "#fdf5f8", text: "#9b3a6b", border: "#f0c4d8" },
  KALIHIM: { bg: "#f0f4ff", text: "#0f2a5e", border: "#c8d5f0" },
};

const OfficialsSection = () => {
  const [captain, setCaptain] = useState<any>(null);
  const [officials, setOfficials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOfficials = async () => {
      try {
        const res = await axios.get(`${API_BASE}/officials`);
        const data = res.data.data || [];

        // Assuming the captain is first or you can filter by position
        const captainData = data.find((o: any) => o.position === "PUNONG BARANGAY");
        const others = data.filter((o: any) => o.position !== "PUNONG BARANGAY");

        setCaptain(captainData);
        setOfficials(others);
      } catch (err: any) {
        console.error(err);
        toast({
          title: "Error",
          description: "Failed to load officials",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOfficials();
  }, []);

  if (loading) return <p className="text-center py-10">Loading officials...</p>;

  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-3 mb-4">
            <div style={{ width: 32, height: 1, backgroundColor: "#c2467d" }} />
            <span className="text-xs font-bold uppercase tracking-[0.20em]" style={{ color: "#c2467d" }}>
              Term 2023 – 2026
            </span>
            <div style={{ width: 32, height: 1, backgroundColor: "#c2467d" }} />
          </div>

          <h2
            className="font-bold text-foreground mb-3 leading-tight"
            style={{ fontFamily: "'Georgia', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.5rem)" }}
          >
            Elected <span style={{ color: "#c2467d" }}>Officials</span>
          </h2>

          <div style={{ width: 48, height: 2, backgroundColor: "#c2467d", margin: "12px auto 20px" }} />
          <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
            Meet the dedicated public servants of Barangay West Rembo committed to serving every resident.
          </p>
        </div>

        {/* Barangay Captain */}
        {captain && (
          <div className="flex justify-center mb-14">
            <div
              className="relative flex flex-col sm:flex-row items-center gap-6 bg-card w-full max-w-lg p-8 border border-border transition-shadow duration-300 hover:shadow-lg"
              style={{ borderRadius: 2, borderTopWidth: 3, borderTopColor: "#c2467d" }}
            >
              <div
                className="absolute -top-3.5 left-8 px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                style={{ backgroundColor: "#0f2a5e", color: "#fff", borderRadius: 1 }}
              >
                {captain.position}
              </div>

              <div
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden flex-shrink-0"
                style={{ border: "3px solid #c2467d", boxShadow: "0 0 0 4px rgba(194,70,125,0.12)" }}
              >
                <img
                  src={!captain.profile_image ? `https://ui-avatars.com/api/?name=${encodeURIComponent(captain.full_name)}&size=200&background=0f2a5e&color=fff` : "https://bold-sunset-533d.clarkkentraguhos.workers.dev/" + captain.profile_image}
                  alt={captain.full_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(captain.full_name)}&size=200&background=0f2a5e&color=fff`;
                  }}
                />
              </div>

              <div className="text-center sm:text-left">
                <h3 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: "'Georgia', serif" }}>
                  {captain.full_name}
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#c2467d" }}>
                  {captain.position}
                </p>
                <p className="text-sm text-muted-foreground">{captain.committee_role}</p>
                <div style={{ width: 36, height: 2, backgroundColor: "#c2467d", marginTop: 12 }} className="mx-auto sm:mx-0" />
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#0f2a5e" }}>
            Council Members
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Officials Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
          {officials.map((official, index) => {
            const badge = positionBadge[official.position] ?? { bg: "#fdf5f8", text: "#c2467d", border: "#f0c4d8" };
            return (
              <div
                key={index}
                className="group flex flex-col items-center text-center bg-card border border-border p-5 sm:p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderRadius: 2 }}
              >
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-4 transition-transform duration-300 group-hover:scale-105"
                  style={{ border: "2px solid #c2467d" }}
                >
                  <img
                    src={!official.profile_image ? `https://ui-avatars.com/api/?name=${encodeURIComponent(official.full_name)}&size=200&background=0f2a5e&color=fff` : "https://bold-sunset-533d.clarkkentraguhos.workers.dev/" + official.profile_image}
                    alt={official.full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-foreground mb-2 leading-snug" style={{ fontFamily: "'Georgia', serif" }}>
                  {official.full_name}
                </h3>
                <span
                  className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 mb-2"
                  style={{ backgroundColor: badge.bg, color: badge.text, border: `1px solid ${badge.border}`, borderRadius: 1 }}
                >
                  {official.position}
                </span>
                <p className="text-xs text-muted-foreground leading-snug">{official.committee_role}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default OfficialsSection;