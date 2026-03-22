import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../../pages/LoginPage.jsx";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
