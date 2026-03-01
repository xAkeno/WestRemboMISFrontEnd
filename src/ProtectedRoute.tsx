import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles: string[]; // roles allowed for this route, e.g. ["admin"]
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    // Fetch user details including role
    axios
      .get("https://westrembomis.onrender.com/api/details", { withCredentials: true })
      .then((res) => {
        const role = res.data.data?.role; // assuming API returns role in data.role
        if (allowedRoles.includes(role)) {
          setIsAllowed(true);
        } else {
          setIsAllowed(false);
        }
      })
      .catch(() => {
        setIsAllowed(false);
      })
      .finally(() => setLoading(false));
  }, [allowedRoles]);

  if (loading) return <div>Loading...</div>;

  if (!isAllowed) return <Navigate to="/*" replace />;

  return children;
};

export default ProtectedRoute;