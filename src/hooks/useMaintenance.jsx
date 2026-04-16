import { useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  withCredentials: true,
});

export function useMaintenance(user) {
  const [maintenance, setMaintenance] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await api.get("/settings/");

      setMaintenance(data.maintenance_mode === "true");
      setMessage(data.maintenance_message || "Under Maintenance");
    };

    fetch();
  }, []);

  const isAdmin = user?.role === "admin";

  return {
    showMaintenance: maintenance && !isAdmin,
    message,
  };
}