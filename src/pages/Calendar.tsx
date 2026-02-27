import React, { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import EventInput from "@fullcalendar/react";
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
            color: event.color || "#d45ea3",
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
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2 - 128, // center tooltip horizontally, 256px width assumed
      y: rect.bottom + 8, // just below the event element
      title: eventInfo.event.title,
      description: eventInfo.event.extendedProps.description,
      eventId: eventInfo.event.id,
      fullData: eventInfo.event.extendedProps.fullData,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const renderEventContent = (eventInfo: any) => {
    const { fullData } = eventInfo.event.extendedProps;
    const bgColor = eventInfo.event.backgroundColor || "#d45ea3";
    const startTime = formatTime(eventInfo.event.startStr?.split("T")[1]);
    const endTime = formatTime(eventInfo.event.endStr?.split("T")[1]);

    return (
      <div
        className="cursor-pointer px-2 py-0.5 w-full rounded-lg overflow-hidden text-white"
        style={{
          backgroundColor: bgColor,
          boxShadow: "0 1px 4px rgba(212,94,163,0.25)",
        }}
        onMouseEnter={(e) => handleMouseEnter(e, eventInfo)}
        onMouseLeave={handleMouseLeave}
        onClick={() => navigate(`/event-detail/${eventInfo.event.id}`, { state: fullData })}
      >
        {startTime && (
          <div className="text-[10px] opacity-80 leading-tight">
            {startTime}{endTime ? ` – ${endTime}` : ""}
          </div>
        )}
        <div className="font-semibold text-xs truncate leading-snug">{eventInfo.event.title}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background relative">
      <Header />

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 rounded-2xl pointer-events-none w-64"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            backgroundColor: "#fff",
            border: "1px solid #f9a8d4",
            boxShadow: "0 8px 32px rgba(212,94,163,0.18)",
          }}
        >
          <div className="h-1 w-full rounded-t-2xl" style={{ backgroundColor: "#d45ea3" }} />
          <div className="p-4">
            <p
              className="font-bold text-sm text-foreground mb-1.5 leading-snug"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              {tooltip.title}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {tooltip.description
                ? tooltip.description.substring(0, 100) + (tooltip.description.length > 100 ? "..." : "")
                : "No description available."}
            </p>
            <div
              className="mt-3 pt-2.5"
              style={{ borderTop: "1px solid #fce7f3" }}
            >
              <span className="text-[10px] font-semibold" style={{ color: "#d45ea3" }}>
                Click to view full details →
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Page content */}
      <div className="flex flex-col items-center pt-32 pb-16 px-4">

        {/* Section header */}
        <div className="text-center mb-10 w-full max-w-5xl">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: "#d45ea3" }}
            >
              Schedule
            </span>
            <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold text-foreground mb-3"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Calendar of{" "}
            <span style={{ color: "#fa43ae" }}>Activities</span>
          </h1>
          <div
            className="mx-auto mt-3 rounded-full"
            style={{ width: 56, height: 3, backgroundColor: "#d45ea3" }}
          />
          <p className="text-muted-foreground text-sm mt-4">
            Stay up to date with upcoming barangay events, programs, and community activities.
          </p>
        </div>

        {/* FullCalendar card */}
        <div
          className="w-full max-w-5xl rounded-2xl overflow-hidden"
          style={{
            boxShadow: "0 4px 32px rgba(212,94,163,0.10)",
            border: "1px solid #fce7f3",
          }}
        >
          <style>{`
            .fc .fc-toolbar {
              padding: 16px 20px;
              background: #fff;
              border-bottom: 1px solid #fce7f3;
              flex-wrap: wrap;
              gap: 8px;
            }
            .fc .fc-toolbar-title {
              font-family: 'Georgia', serif;
              font-size: 1.15rem;
              font-weight: 700;
              color: #1a0a13;
            }
            .fc .fc-button {
              background-color: #fff !important;
              border: 1px solid #f9a8d4 !important;
              color: #d45ea3 !important;
              border-radius: 10px !important;
              font-size: 0.75rem !important;
              font-weight: 600 !important;
              padding: 4px 12px !important;
              box-shadow: none !important;
              transition: all 0.2s !important;
            }
            .fc .fc-button:hover {
              background-color: #fce7f3 !important;
              border-color: #d45ea3 !important;
            }
            .fc .fc-button-active,
            .fc .fc-button-primary:not(:disabled).fc-button-active {
              background-color: #d45ea3 !important;
              border-color: #d45ea3 !important;
              color: #fff !important;
            }
            .fc .fc-today-button {
              background-color: #d45ea3 !important;
              border-color: #d45ea3 !important;
              color: #fff !important;
            }
            .fc .fc-col-header-cell {
              background: #fdf2f8;
              padding: 10px 0;
            }
            .fc .fc-col-header-cell-cushion {
              font-size: 0.68rem;
              font-weight: 700;
              letter-spacing: 0.1em;
              text-transform: uppercase;
              color: #d45ea3;
              text-decoration: none;
            }
            .fc .fc-day-today {
              background-color: #fdf2f8 !important;
            }
            .fc .fc-day-today .fc-daygrid-day-number {
              background-color: #d45ea3;
              color: #fff;
              border-radius: 50%;
              width: 26px;
              height: 26px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 800;
            }
            .fc .fc-daygrid-day-number {
              font-size: 0.8rem;
              font-weight: 600;
              color: #607a86;
              text-decoration: none;
              padding: 6px 8px;
            }
            .fc .fc-scrollgrid {
              border: none !important;
            }
            .fc td, .fc th {
              border-color: #fce7f3 !important;
            }
            .fc-daygrid-event {
              border: none !important;
              border-radius: 8px !important;
              margin: 1px 2px !important;
            }
            .fc-view-harness {
              background: #fff;
            }
          `}</style>

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
    </div>
  );
};

export default Calendar;