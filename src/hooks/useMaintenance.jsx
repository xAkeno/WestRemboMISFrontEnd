import { useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  withCredentials: true,
});

export function useMaintenance(user) {
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [vacation, setVacation] = useState(false);
  const [vacationStart, setVacationStart] = useState("");
  const [vacationEnd, setVacationEnd] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await api.get("/settings/");

      setMaintenance(data.maintenance_mode === "true");
      setMaintenanceMessage(data.maintenance_message || "Under Maintenance");
      setVacation(data.vacation_mode === "true");
      setVacationStart(data.vacation_start || "");
      setVacationEnd(data.vacation_end || "");
    };

    fetchSettings();
  }, []);

  const isAdmin = user?.role === "admin";

  return {
    showMaintenance: maintenance && !isAdmin,
    message: maintenanceMessage,
    showVacation: vacation && !isAdmin,
    vacationStart,
    vacationEnd,
  };
}