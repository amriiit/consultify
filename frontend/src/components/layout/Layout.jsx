import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Brand, Icon } from "../common/UI";
export default function Layout() {
  const { user, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="nav-wrap">
          <Brand />
          <button
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="main-nav"
            onClick={() => setOpen(!open)}
          >
            {open ? "Close" : "Menu"}
            <Icon name={open ? "close" : "plus"} />
          </button>
          <nav
            id="main-nav"
            className={open ? "open" : ""}
            aria-label="Main navigation"
          >
            <NavLink to="/advisors">Find an advisor</NavLink>
            <NavLink to="/community">Community</NavLink>
            {user ? (
              <>
                <NavLink to="/dashboard">Dashboard</NavLink>
                <NavLink to="/account">Account</NavLink>
                <button
                  className="nav-logout"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              !loading && (
                <>
                  <NavLink to="/login">Log in</NavLink>
                  <Link className="button small" to="/register">
                    Get started
                    <Icon />
                  </Link>
                </>
              )
            )}
          </nav>
        </div>
      </header>
      <main id="main" tabIndex="-1">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container footer-top">
          <div>
            <Brand />
            <p>
              A clearer financial perspective.
              <br />
              One conversation at a time.
            </p>
          </div>
          <div className="footer-links">
            <Link to="/advisors">Find an advisor</Link>
            <Link to="/community">Explore the community</Link>
            <Link to="/register/advisor">Join as an advisor</Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Consultify</span>
          <span>Thoughtful conversations. Informed decisions.</span>
        </div>
      </footer>
    </>
  );
}
export function Workspace({ children }) {
  const { user } = useAuth();
  const advisor = user.role === "ADVISOR";
  return (
    <div className="container workspace">
      <aside className="sidebar">
        <p className="eyebrow">Your workspace</p>
        <NavLink to="/dashboard">
          <Icon name="people" />
          Overview
        </NavLink>
        <NavLink to={advisor ? "/advisor/appointments" : "/user/appointments"}>
          <Icon name="calendar" />
          Appointments
        </NavLink>
        {advisor && (
          <NavLink to="/advisor/profile">
            <Icon name="people" />
            Professional profile
          </NavLink>
        )}
        <NavLink to="/community">
          <Icon name="message" />
          Community
        </NavLink>
        <NavLink to="/account">Account details</NavLink>
        <div className="sidebar-note">
          {advisor
            ? "Make room for a better conversation."
            : "Your next chapter starts with a question."}
        </div>
      </aside>
      <section className="workspace-content">{children}</section>
    </div>
  );
}
