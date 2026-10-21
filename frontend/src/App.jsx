import { Routes, Route, Link } from "react-router-dom";
import Layout from "./components/Layout";
import Guard from "./components/Guard";
import Home from "./pages/Home";
import AuthPage from "./pages/Auth";
import {
  AdvisorDirectory,
  AdvisorDetail,
  AdvisorProfile,
} from "./pages/Advisors";
import Appointments from "./pages/Appointments";
import { CommunityFeed, NewPost, PostDetail } from "./pages/Community";
import { Dashboard, Account } from "./pages/Dashboard";
import { Empty } from "./components/common";
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<AuthPage />} />
        <Route path="register" element={<AuthPage register />} />
        <Route
          path="register/advisor"
          element={<AuthPage register advisor />}
        />
        <Route path="advisors" element={<AdvisorDirectory />} />
        <Route path="advisors/:id" element={<AdvisorDetail />} />
        <Route path="community" element={<CommunityFeed />} />
        <Route path="community/:id" element={<PostDetail />} />
        <Route element={<Guard />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="account" element={<Account />} />
          <Route path="community/new" element={<NewPost />} />
        </Route>
        <Route element={<Guard role="USER" />}>
          <Route path="user/appointments" element={<Appointments />} />
        </Route>
        <Route element={<Guard role="ADVISOR" />}>
          <Route path="advisor/appointments" element={<Appointments />} />
          <Route path="advisor/profile" element={<AdvisorProfile />} />
        </Route>
        <Route
          path="*"
          element={
            <Empty title="This page is a little off track.">
              <Link to="/">Return to Consultify →</Link>
            </Empty>
          }
        />
      </Route>
    </Routes>
  );
}
