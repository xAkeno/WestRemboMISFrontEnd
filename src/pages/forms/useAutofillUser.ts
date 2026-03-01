import { useEffect } from "react";
import api from "@/components/services/clearanceApi";

export const useAutofillUser = (setFormData: any) => {
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await api.get("/me", { withCredentials: true });
        const user = res.data;

        setFormData((prev: any) => ({
          ...prev,
          prefix: user.prefix || "",
          surname: user.surname || "",
          first_name: user.first_name || "",
          middle_name: user.middle_name || "",
          ext_name: user.extension_name || "",
          house_block_lot_no: user.house_block_lot_no || "",
          street: user.street || "",
          zone: user.zone_purok || "",
        }));

      } catch (err) {
        console.error("Autofill failed:", err);
      }
    };

    loadUser();
  }, [setFormData]);
};