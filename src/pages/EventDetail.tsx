import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, FileText, AlertCircle, Maximize2, X, ArrowLeft } from "lucide-react";
import Header from "@/components/forms/Header";

const EventDetail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const event = location.state as any;
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!event) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: "#fce7f3" }}
        >
          <Calendar className="w-8 h-8" style={{ color: "#d45ea3" }} />
        </div>
        <p className="text-foreground font-semibold">No event selected.</p>
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
  const endDate = formatDate(event.end);
  const startTime = formatTime(event.start);
  const endTime = formatTime(event.end);
  const isSameDay = startDate === endDate;

  const metaItems = [
    {
      icon: Calendar,
      label: "Date",
      value: isSameDay ? startDate : `${startDate} to ${endDate}`,
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
          style={{ backgroundColor: "rgba(26,10,19,0.92)" }}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            onClick={() => setLightboxOpen(false)}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.25)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.15)")}
          >
            <X className="h-5 w-5 text-white" />
          </button>
          <img
            src={image}
            alt={event.title}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-16">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-medium mb-8 transition-colors duration-200 group"
          style={{ color: "#d45ea3" }}
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Back to Calendar
        </button>

        {/* Card */}
        <div
          className="bg-card rounded-2xl border border-border overflow-hidden"
          style={{ boxShadow: "0 4px 32px rgba(212,94,163,0.10)" }}
        >
          {/* Pink top accent bar */}
          <div style={{ height: 4, backgroundColor: "#d45ea3" }} />

          {/* Image */}
          {image && (
            <div className="relative w-full h-64 sm:h-72">
              <img
                src={image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to top, rgba(26,10,19,0.5) 0%, transparent 50%)",
                }}
              />
              {/* Expand button */}
              <button
                onClick={() => setLightboxOpen(true)}
                className="absolute bottom-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                style={{ backgroundColor: "#d45ea3", boxShadow: "0 2px 12px rgba(212,94,163,0.40)" }}
                title="View full image"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="px-6 sm:px-8 py-7 space-y-6">

            {/* Title + Important badge */}
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex-1 min-w-0">
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 mb-2">
                  <div className="h-px w-6" style={{ backgroundColor: "#d45ea3" }} />
                  <span
                    className="text-xs font-bold uppercase tracking-[0.2em]"
                    style={{ color: "#d45ea3" }}
                  >
                    Barangay Event
                  </span>
                </div>
                <h1
                  className="text-2xl sm:text-3xl font-bold text-foreground leading-snug"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  {event.title}
                </h1>
                <div
                  className="mt-2 rounded-full"
                  style={{ width: 40, height: 3, backgroundColor: "#d45ea3" }}
                />
              </div>

              {important === 1 && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#fce7f3", color: "#d45ea3", border: "1px solid #f9a8d4" }}
                >
                  <AlertCircle className="h-3 w-3" />
                  Important
                </span>
              )}
            </div>

            {/* Meta info */}
            <div className="grid sm:grid-cols-2 gap-3">
              {metaItems.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 rounded-xl p-4"
                  style={{ backgroundColor: "#fdf2f8", border: "1px solid #fce7f3" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: "#fce7f3" }}
                  >
                    <Icon className="h-4 w-4" style={{ color: "#d45ea3" }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: "#d45ea3" }}>
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
                className="rounded-xl p-5"
                style={{ backgroundColor: "#fdf2f8", border: "1px solid #fce7f3" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "#fce7f3" }}
                  >
                    <FileText className="h-4 w-4" style={{ color: "#d45ea3" }} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#d45ea3" }}>
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