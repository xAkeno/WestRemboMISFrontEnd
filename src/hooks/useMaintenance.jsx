import { useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  withCredentials: true,
});

export function useMaintenance(user) {
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [activeVacation, setActiveVacation] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await api.get("/settings/");

      setMaintenance(data.maintenance_mode === "true");
      setMaintenanceMessage(data.maintenance_message || "Under Maintenance");

      // Parse the dynamic vacations array
      let vacations = [];
      try {
        vacations = JSON.parse(data.vacations || "[]");
      } catch {
        vacations = [];
      }

      // Find one that is active and covers today
      const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
      const current = vacations.find(
        (v) => v.active === true && v.start <= today && v.end >= today
      );

      setActiveVacation(current ?? null);
    };

    fetchSettings();
  }, []);

  const isAdmin = user?.role === "admin";

  return {
    showMaintenance: maintenance && !isAdmin,
    message: maintenanceMessage,
    showVacation: !!activeVacation && !isAdmin,
    vacationStart: activeVacation?.start ?? "",
    vacationEnd:   activeVacation?.end   ?? "",
    vacationName:  activeVacation?.name  ?? "",
  };
}