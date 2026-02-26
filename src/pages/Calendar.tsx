import React, { useEffect, useState, useRef } from "react";
import FullCalendar, { EventInput } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Header from "@/components/forms/Header";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  color?: string;
  extendedProps: {
    description?: string;
    location?: string;
    image?: string | null;
    important?: boolean;
  };
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  title: string;
  description?: string;
  eventId: string;
  fullData: any;
}

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, title: "", description: "", eventId: "", fullData: null,
  });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/public-events");
        if (response.data.status) {
          const mapped = response.data.data.map((event: CalendarEvent) => ({
            id: event.id,
            title: event.title,
            start: event.start,
            end: event.end,
            color: event.color || "#0047AB",
            extendedProps: {
              description: event.extendedProps.description,
              location: event.extendedProps.location,
              image: event.extendedProps.image,
              important: event.extendedProps.important,
              fullData: event,
            },
          }));
          setEvents(mapped);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvents();
  }, []);

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "";
    const [hourStr, minuteStr] = timeStr.split(":");
    const hour = parseInt(hourStr);
    const meridiem = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minuteStr} ${meridiem}`;
  };

  const handleMouseEnter = (e: React.MouseEvent, eventInfo: any) => {
    const { description, fullData } = eventInfo.event.extendedProps;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 6,
      title: eventInfo.event.title,
      description,
      eventId: eventInfo.event.id,
      fullData,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const renderEventContent = (eventInfo: any) => {
    const { description, fullData } = eventInfo.event.extendedProps;
    const bgColor = eventInfo.event.backgroundColor || "#0047AB";
    const startTime = formatTime(eventInfo.event.startStr?.split("T")[1]);
    const endTime = formatTime(eventInfo.event.endStr?.split("T")[1]);

    return (
      <div
        className="text-white cursor-pointer px-1 w-full rounded overflow-hidden"
        style={{ backgroundColor: bgColor }}
        onMouseEnter={(e) => handleMouseEnter(e, eventInfo)}
        onMouseLeave={handleMouseLeave}
        onClick={() => navigate(`/event-detail/${eventInfo.event.id}`, { state: fullData })}
      >
        {startTime && (
          <div className="text-xs opacity-90">
            {startTime}{endTime ? ` – ${endTime}` : ""}
          </div>
        )}
        <div className="font-semibold text-sm truncate">{eventInfo.event.title}</div>
      </div>
    );
  };

  return (
    <div className="flex justify-center my-5 relative">
      <Header />

      {/* Tooltip Portal */}
      {tooltip.visible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 w-64 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {/* Title */}
          <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1 leading-snug">
            {tooltip.title}
          </p>

          {/* Description */}
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">
            {tooltip.description
              ? tooltip.description.substring(0, 100) + (tooltip.description.length > 100 ? "..." : "")
              : "No description available."}
          </p>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-600 mt-2 pt-2">
            <span className="text-xs text-blue-500 font-medium flex items-center gap-1">
              🔍 Click to view full detail
            </span>
          </div>
        </div>
      )}

      <div className="w-3/5 max-lg:w-4/5 max-md:w-11/12 max-sm:w-full mt-32">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          eventContent={renderEventContent}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          eventTimeFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
          }}
        />
      </div>
    </div>
  );
};

export default Calendar;