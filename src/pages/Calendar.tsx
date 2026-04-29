import React, { useEffect, useState, useRef, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Header from "@/components/forms/Header";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CircleAlert, CalendarDays, Clock, MapPin, ChevronRight, Sparkles, CheckCircle2, CalendarRange } from "lucide-react";

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

type EventTab = "happening" | "upcoming" | "past" | "all";

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, title: "", description: "", eventId: "", fullData: null,
  });
  const [activeTab, setActiveTab] = useState<EventTab>("upcoming");
  const tooltipRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get("https://westrembomis.onrender.com/api/public-events");
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

  const now = new Date();

  const categorized = useMemo(() => {
    const happening: any[] = [];
    const upcoming: any[] = [];
    const past: any[] = [];

    events.forEach((ev) => {
      const start = new Date(ev.start);
      const end = ev.end ? new Date(ev.end) : new Date(start.getTime() + 60 * 60 * 1000);
      if (start <= now && end >= now) happening.push(ev);
      else if (start > now) upcoming.push(ev);
      else past.push(ev);
    });

    upcoming.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    past.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

    return { happening, upcoming, past, all: [...happening, ...upcoming, ...past] };
  }, [events, now.toDateString()]);

  const tabList: { key: EventTab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "happening", label: "Happening Now", icon: <Sparkles size={13} />, count: categorized.happening.length },
    { key: "upcoming", label: "Upcoming", icon: <Clock size={13} />, count: categorized.upcoming.length },
    { key: "past", label: "Past", icon: <CheckCircle2 size={13} />, count: categorized.past.length },
    { key: "all", label: "All Events", icon: <CalendarRange size={13} />, count: categorized.all.length },
  ];

  const displayedEvents = categorized[activeTab];

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "";
    const [hourStr, minuteStr] = timeStr.split(":");
    const hour = parseInt(hourStr);
    const meridiem = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minuteStr} ${meridiem}`;
  };

  const formatEventDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatEventTime = (dateStr: string) => {
    const timeStr = dateStr.split("T")[1];
    if (!timeStr) return "";
    return formatTime(timeStr.substring(0, 5));
  };

  const handleMouseEnter = (e: React.MouseEvent, eventInfo: any) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2 - 128,
      y: rect.bottom + 8,
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
        style={{ backgroundColor: bgColor, boxShadow: "0 1px 4px rgba(212,94,163,0.25)" }}
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
            <p className="font-bold text-sm text-foreground mb-1.5 leading-snug" style={{ fontFamily: "'Georgia', serif" }}>
              {tooltip.title}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {tooltip.description
                ? tooltip.description.substring(0, 100) + (tooltip.description.length > 100 ? "..." : "")
                : "No description available."}
            </p>
            <div className="mt-3 pt-2.5" style={{ borderTop: "1px solid #fce7f3" }}>
              <span className="text-[10px] font-semibold" style={{ color: "#d45ea3" }}>
                Click to view full details →
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center pt-32 pb-16 px-4">
        {/* Section header */}
        <div className="text-center mb-10 w-full max-w-6xl">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
            <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#d45ea3" }}>Schedule</span>
            <div className="h-px w-8" style={{ backgroundColor: "#d45ea3" }} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3" style={{ fontFamily: "'Georgia', serif" }}>
            Calendar of{" "}
            <span style={{ color: "#fa43ae" }}>Activities</span>
          </h1>
          <div className="mx-auto mt-3 rounded-full" style={{ width: 56, height: 3, backgroundColor: "#d45ea3" }} />
          <p className="text-muted-foreground text-sm mt-4">
            Stay up to date with upcoming barangay events, programs, and community activities.
          </p>
          <div className="relative inline-block group mt-3">
            <div
              className="flex items-center justify-center w-16 h-8 gap-1 rounded-full text-white text-xs font-bold cursor-pointer"
              style={{ backgroundColor: "#d45ea3" }}
            >
              <CircleAlert size={14} />
              Tips
            </div>
            <div
              className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={{ backgroundColor: "#fff", border: "1px solid #f9a8d4", boxShadow: "0 6px 24px rgba(212,94,163,0.18)", zIndex: 50 }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: "#d45ea3" }}>How to use the calendar</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Hover over an event to see a short preview.</li>
                <li>• Click an event to open the full details.</li>
                <li>• Use the buttons above to change view (Month / Week / Day).</li>
                <li>• Use arrows to navigate to other dates.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main layout: Calendar + Side Panel */}
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-5">

          {/* FullCalendar card */}
          <div
            className="flex-1 min-w-0 rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 4px 32px rgba(212,94,163,0.10)", border: "1px solid #fce7f3" }}
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

          {/* Side Panel */}
          <div
            className="w-full lg:w-80 xl:w-96 flex-shrink-0 rounded-2xl overflow-hidden flex flex-col"
            style={{
              border: "1px solid #fce7f3",
              boxShadow: "0 4px 32px rgba(212,94,163,0.10)",
              backgroundColor: "#fff",
              maxHeight: "700px",
            }}
          >
            {/* Panel Header */}
            <div
              className="px-5 py-4 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #d45ea3 0%, #fa43ae 100%)" }}
            >
              <CalendarDays size={18} className="text-white" />
              <span className="text-white font-bold text-sm tracking-wide" style={{ fontFamily: "'Georgia', serif" }}>
                Events
              </span>
              <span className="ml-auto text-white/70 text-xs font-medium">
                {events.length} total
              </span>
            </div>

            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: "#fce7f3" }}>
              {tabList.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex-1 py-2.5 flex flex-col items-center gap-0.5 text-[10px] font-semibold transition-all duration-150 relative"
                  style={{
                    color: activeTab === tab.key ? "#d45ea3" : "#9ca3af",
                    backgroundColor: activeTab === tab.key ? "#fdf2f8" : "transparent",
                    borderBottom: activeTab === tab.key ? "2px solid #d45ea3" : "2px solid transparent",
                  }}
                >
                  <span className="flex items-center gap-1">
                    {tab.icon}
                  </span>
                  <span className="leading-none">{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className="absolute top-1.5 right-1.5 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                      style={{
                        backgroundColor: activeTab === tab.key ? "#d45ea3" : "#e9d5ff",
                        color: activeTab === tab.key ? "#fff" : "#7c3aed",
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Event List */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#f9a8d4 transparent" }}>
              {displayedEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                    style={{ backgroundColor: "#fdf2f8" }}
                  >
                    <CalendarDays size={22} style={{ color: "#d45ea3" }} />
                  </div>
                  <p className="text-sm font-semibold text-gray-400">No events here</p>
                  <p className="text-xs text-gray-300 mt-1">
                    {activeTab === "happening" && "No events are happening right now."}
                    {activeTab === "upcoming" && "No upcoming events scheduled."}
                    {activeTab === "past" && "No past events found."}
                    {activeTab === "all" && "No events available."}
                  </p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {displayedEvents.map((ev) => {
                    const isHappening = categorized.happening.some((h) => h.id === ev.id);
                    const isPast = categorized.past.some((p) => p.id === ev.id);
                    const evColor = ev.color || "#d45ea3";

                    return (
                      <button
                        key={ev.id}
                        onClick={() => navigate(`/event-detail/${ev.id}`, { state: ev.extendedProps?.fullData })}
                        className="w-full text-left rounded-xl p-3 transition-all duration-150 group relative overflow-hidden"
                        style={{
                          backgroundColor: "#fdf2f8",
                          border: `1px solid ${isHappening ? evColor : "#fce7f3"}`,
                          opacity: isPast ? 0.7 : 1,
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "#fce7f3";
                          (e.currentTarget as HTMLElement).style.borderColor = evColor;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "#fdf2f8";
                          (e.currentTarget as HTMLElement).style.borderColor = isHappening ? evColor : "#fce7f3";
                        }}
                      >
                        {/* Color accent bar */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                          style={{ backgroundColor: evColor }}
                        />
                        <div className="pl-3">
                          {/* Status badge */}
                          {isHappening && (
                            <span
                              className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5"
                              style={{ backgroundColor: evColor + "22", color: evColor }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: evColor }} />
                              Live Now
                            </span>
                          )}
                          {isPast && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5 bg-gray-100 text-gray-400">
                              <CheckCircle2 size={9} />
                              Ended
                            </span>
                          )}

                          {/* Title */}
                          <p
                            className="text-xs font-bold leading-snug mb-1.5 pr-4"
                            style={{ color: "#1a0a13", fontFamily: "'Georgia', serif" }}
                          >
                            {ev.title}
                          </p>

                          {/* Date */}
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-0.5">
                            <CalendarDays size={10} style={{ color: evColor }} />
                            <span>{formatEventDate(ev.start)}</span>
                          </div>

                          {/* Time */}
                          {ev.start?.includes("T") && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-0.5">
                              <Clock size={10} style={{ color: evColor }} />
                              <span>
                                {formatEventTime(ev.start)}
                                {ev.end?.includes("T") ? ` – ${formatEventTime(ev.end)}` : ""}
                              </span>
                            </div>
                          )}

                          {/* Location */}
                          {ev.extendedProps?.location && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                              <MapPin size={10} style={{ color: evColor }} />
                              <span className="truncate">{ev.extendedProps.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Arrow */}
                        <ChevronRight
                          size={14}
                          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: evColor }}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Panel Footer */}
            <div className="px-4 py-3" style={{ borderTop: "1px solid #fce7f3" }}>
              <button
                onClick={() => setActiveTab("all")}
                className="w-full py-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5"
                style={{
                  backgroundColor: activeTab === "all" ? "#d45ea3" : "#fdf2f8",
                  color: activeTab === "all" ? "#fff" : "#d45ea3",
                  border: "1px solid #f9a8d4",
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== "all") {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#fce7f3";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== "all") {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#fdf2f8";
                  }
                }}
              >
                <CalendarRange size={13} />
                View All Events ({events.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;