import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorState, Loading, Empty } from "./common";
export default function Guard({ role }) {
  const { user, loading, error, restore } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="container section">
        <Loading />
      </div>
    );
  if (error)
    return <ErrorState error={{ message: error }} retry={() => restore()} />;
  if (!user)
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  if (role && user.role !== role)
    return (
      <Empty title="This area belongs to a different role.">
        You are signed in as {user.role.toLowerCase()}. Use your dashboard to
        find the right tools.
      </Empty>
    );
  return <Outlet />;
}
