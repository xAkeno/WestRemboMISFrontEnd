import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, FileText, AlertCircle, Maximize2, X, ArrowLeft } from "lucide-react";
import Header from "@/components/forms/Header";

const NAVY = "#0f2a5e";
const PINK = "#c2467d";

const EventDetail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const event = location.state as any;
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!event) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div
          className="w-14 h-14 flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: "#f0f4ff", borderRadius: 2 }}
        >
          <Calendar className="w-7 h-7" style={{ color: NAVY }} />
        </div>
        <p className="text-foreground font-semibold" style={{ fontFamily: "'Georgia', serif" }}>
          No event selected.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all duration-200"
          style={{ backgroundColor: NAVY, borderRadius: 1 }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#1a3d7c"}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = NAVY}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Calendar
        </button>
      </div>
    </div>
  );

  const { description, image, location: venue, important } = event.extendedProps;

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-PH", {
      month: "long", day: "numeric", year: "numeric",
    });
  };

  const formatTime = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("en-PH", {
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  };

  const startDate = formatDate(event.start);
  const endDate   = formatDate(event.end);
  const startTime = formatTime(event.start);
  const endTime   = formatTime(event.end);
  const isSameDay = startDate === endDate;

  const metaItems = [
    {
      icon: Calendar,
      label: "Date",
      value: isSameDay ? startDate : `${startDate} — ${endDate}`,
    },
    {
      icon: Clock,
      label: "Time",
      value: `${startTime} – ${endTime}`,
    },
    ...(venue ? [{ icon: MapPin, label: "Location", value: venue }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Lightbox */}
      {lightboxOpen && image && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(10,20,60,0.92)" }}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center transition-colors duration-200"
            style={{ backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 1 }}
            onClick={() => setLightboxOpen(false)}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.22)"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.12)"}
          >
            <X className="h-5 w-5 text-white" />
          </button>
          <img
            src={image}
            alt={event.title}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            style={{ borderRadius: 2 }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-16">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-8 transition-colors duration-200 group"
          style={{ color: "#6b7280" }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = NAVY}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "#6b7280"}
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Back to Calendar
        </button>

        {/* Card */}
        <div
          className="bg-card border border-border overflow-hidden"
          style={{ borderRadius: 2, borderTopWidth: 3, borderTopColor: PINK }}
        >
          {/* Event image */}
          {image && (
            <div className="relative w-full h-64 sm:h-72">
              <img
                src={"https://pub-ac8a9453b771431ba35a02dd460d8da1.r2.dev/" + image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              {/* Navy gradient overlay */}
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(10,20,60,0.55) 0%, transparent 55%)" }}
              />
              {/* Expand button */}
              <button
                onClick={() => setLightboxOpen(true)}
                className="absolute bottom-3 right-3 w-9 h-9 flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                style={{ backgroundColor: PINK, borderRadius: 1, boxShadow: "0 2px 12px rgba(194,70,125,0.40)" }}
                title="View full image"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="px-6 sm:px-8 py-7 space-y-6">

            {/* Title row */}
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex-1 min-w-0">
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-3 mb-2">
                  <div style={{ width: 24, height: 1, backgroundColor: PINK }} />
                  <span
                    className="text-xs font-bold uppercase tracking-[0.20em]"
                    style={{ color: PINK }}
                  >
                    Barangay Event
                  </span>
                </div>

                <h1
                  className="font-bold text-foreground leading-snug"
                  style={{ fontFamily: "'Georgia', serif", fontSize: "clamp(1.3rem, 3vw, 1.9rem)" }}
                >
                  {event.title}
                </h1>

                <div style={{ width: 40, height: 2, backgroundColor: PINK, marginTop: 10 }} />
              </div>

              {important === 1 && (
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 flex-shrink-0 uppercase tracking-wider"
                  style={{
                    backgroundColor: "#fdf5f8",
                    color: PINK,
                    border: `1px solid #f0c4d8`,
                    borderRadius: 1,
                  }}
                >
                  <AlertCircle className="h-3 w-3" />
                  Important
                </span>
              )}
            </div>

            {/* Meta info grid */}
            <div className="grid sm:grid-cols-2 gap-3">
              {metaItems.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 p-4"
                  style={{
                    backgroundColor: "#f8faff",
                    border: "1px solid #dde3ed",
                    borderRadius: 2,
                    borderLeft: `2px solid ${NAVY}`,
                  }}
                >
                  <div
                    className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: "#f0f4ff", borderRadius: 1 }}
                  >
                    <Icon className="h-4 w-4" style={{ color: NAVY }} />
                  </div>
                  <div>
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                      style={{ color: PINK }}
                    >
                      {label}
                    </p>
                    <p className="text-sm text-foreground font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            {description && (
              <div
                className="p-5"
                style={{
                  backgroundColor: "#f8faff",
                  border: "1px solid #dde3ed",
                  borderRadius: 2,
                  borderLeft: `2px solid ${PINK}`,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-7 h-7 flex items-center justify-center"
                    style={{ backgroundColor: "#f0f4ff", borderRadius: 1 }}
                  >
                    <FileText className="h-4 w-4" style={{ color: NAVY }} />
                  </div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: PINK }}
                  >
                    Description
                  </p>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {description}
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;