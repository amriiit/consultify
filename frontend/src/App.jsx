import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./routes/ProtectedRoute";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Advisors from "./pages/Advisors";
import AdvisorDetails from "./pages/AdvisorDetails";
import Dashboard from "./pages/Dashboard";
import AdvisorProfile from "./pages/AdvisorProfile";
import Appointments from "./pages/Appointments";
import Community from "./pages/Community";
import CommunityPost from "./pages/CommunityPost";
import CreatePost from "./pages/CreatePost";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
export default function App() {
  const location = useLocation();
  useEffect(() => {
    const label = location.pathname.split("/").filter(Boolean)[0];
    document.title = label
      ? `${label[0].toUpperCase() + label.slice(1)} — Consultify`
      : "Consultify — A clearer financial perspective";
  }, [location.pathname]);
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Auth key="login" />} />
        <Route path="register" element={<Auth register key="register" />} />
        <Route
          path="register/advisor"
          element={<Auth register advisor key="advisor" />}
        />
        <Route path="advisors" element={<Advisors />} />
        <Route path="advisors/:id" element={<AdvisorDetails />} />
        <Route path="community" element={<Community />} />
        <Route path="community/:id" element={<CommunityPost />} />
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="account" element={<Account />} />
          <Route path="community/new" element={<CreatePost />} />
        </Route>
        <Route element={<ProtectedRoute role="USER" />}>
          <Route path="user/appointments" element={<Appointments />} />
        </Route>
        <Route element={<ProtectedRoute role="ADVISOR" />}>
          <Route path="advisor/appointments" element={<Appointments />} />
          <Route path="advisor/profile" element={<AdvisorProfile />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
