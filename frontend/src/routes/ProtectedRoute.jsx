import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert, Loading } from "../components/common/UI";
export default function ProtectedRoute({ role }) {
  const { user, loading, sessionError, restore } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="container section">
        <Loading />
      </div>
    );
  if (!user && sessionError && !sessionError.includes("expired"))
    return (
      <div className="container section">
        <Alert>{sessionError}</Alert>
        <button className="button" onClick={restore}>
          Retry session
        </button>
      </div>
    );
  if (!user)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
