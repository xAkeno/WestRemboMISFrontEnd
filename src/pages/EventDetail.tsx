import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, FileText, AlertCircle, Maximize2, X } from "lucide-react";
import Header from "@/components/forms/Header";

const EventDetail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const event = location.state as any;
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!event) return <div className="p-6 text-center">No event selected.</div>;

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

  return (
    <div className="max-w-4xl mx-auto p-6 mt-32 pb-12">
      <Header />

      {/* Lightbox */}
      {lightboxOpen && image && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/30 rounded-full p-2 transition"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={image}
            alt={event.title}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-blue-500 hover:underline flex items-center gap-1"
      >
        ← Back to Calendar
      </button>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden">

        {/* Image Row — horizontal, full width */}
        {image && (
          <div className="relative w-full h-64">
            <img
              src={image}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            {/* Circle button on bottom-right */}
            <button
              onClick={() => setLightboxOpen(true)}
              className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-2.5 shadow-lg backdrop-blur-sm transition"
              title="View full image"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Details below image */}
        <div className="px-6 py-5 space-y-4">
          {/* Title + Important Badge */}
          <div className="flex items-start gap-2">
            <h1 className="text-xl font-bold leading-snug">{event.title}</h1>
            {important === 1 && (
              <span className="mt-1 inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                <AlertCircle className="h-3 w-3" /> Important
              </span>
            )}
          </div>

          <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-3">
              <Calendar className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">Date</span>
                <p>{isSameDay ? startDate : `${startDate} to ${endDate}`}</p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <Clock className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">Time</span>
                <p>{startTime} – {endTime}</p>
              </div>
            </li>

            {venue && (
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">Location</span>
                  <p>{venue}</p>
                </div>
              </li>
            )}

            {description && (
              <li className="flex items-start gap-3">
                <FileText className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">Description</span>
                  <p className="mt-1 whitespace-pre-line leading-relaxed">{description}</p>
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;