import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminRoute() {
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin) {
      toast.error("You don't have permission to access this page.");
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
