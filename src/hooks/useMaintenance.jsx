import { useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_WEB_URL}/api`,
  withCredentials: true,
});

export function useMaintenance(user) {
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [activeVacation, setActiveVacation] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get("/settings/");

        setMaintenance(data.maintenance_mode === "true");
        setMaintenanceMessage(data.maintenance_message || "Under Maintenance");

        const today = new Date().toISOString().split("T")[0];

        // Parse vacations array
        let vacations = [];
        try {
          vacations = JSON.parse(data.vacations || "[]");
        } catch {
          vacations = [];
        }

        console.log("[useMaintenance] today:", today);
        console.log("[useMaintenance] vacations:", vacations);

        // Find an active vacation that covers today
        const namedVacation = vacations.find(
          (v) => v.active === true && v.start <= today && v.end >= today
        );

        console.log("[useMaintenance] matched vacation:", namedVacation);

        if (namedVacation) {
          setActiveVacation({
            id:    namedVacation.id,
            name:  namedVacation.name,   // e.g. "Bonifacio Day"
            start: namedVacation.start,
            end:   namedVacation.end,
          });
          return;
        }

        // Fallback: top-level vacation_mode fields
        const topLevelActive =
          data.vacation_mode === "true" &&
          data.vacation_start &&
          data.vacation_end &&
          data.vacation_start <= today &&
          data.vacation_end >= today;

        if (topLevelActive) {
          setActiveVacation({
            name:  "",
            start: data.vacation_start,
            end:   data.vacation_end,
          });
          return;
        }

        setActiveVacation(null);
      } catch (err) {
        console.error("[useMaintenance] Failed to fetch settings", err);
      }
    };

    fetchSettings();
  }, []);

  const isAdmin = user?.role === "admin";

  console.log("[useMaintenance] return →", {
    showVacation: !!activeVacation && !isAdmin,
    vacationName: activeVacation?.name,
    vacationStart: activeVacation?.start,
    vacationEnd: activeVacation?.end,
  });

  return {
    showMaintenance: maintenance && !isAdmin,
    message:         maintenanceMessage,
    showVacation:    !!activeVacation && !isAdmin,
    vacationStart:   activeVacation?.start ?? "",
    vacationEnd:     activeVacation?.end   ?? "",
    vacationName:    activeVacation?.name  ?? "",
  };
}