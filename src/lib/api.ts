import axios from "axios";

const api = axios.create({
  baseURL: "https://westrembomis.onrender.com",
  withCredentials: true,
});

// Attach Bearer token from localStorage to every request automatically
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        // Axios types can be strict; mutate headers safely
        if (!config.headers) {
          config.headers = {} as any;
        }
        (config.headers as any)["Authorization"] = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
