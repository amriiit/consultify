import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Notice } from "./common";
export default function Layout() {
  const { user, logout, notice, error, restore } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
    document.querySelector("main")?.focus({ preventScroll: true });
  }, [location.pathname]);
  const links = user
    ? user.role === "ADVISOR"
      ? [
          ["/dashboard", "Overview"],
          ["/advisor/profile", "My professional profile"],
          ["/advisor/appointments", "Incoming appointments"],
          ["/community", "Community"],
          ["/account", "My account"],
        ]
      : [
          ["/dashboard", "Overview"],
          ["/advisors", "Find advisors"],
          ["/user/appointments", "My appointments"],
          ["/community", "Community"],
          ["/account", "My account"],
        ]
    : [
        ["/", "Home"],
        ["/advisors", "Advisors"],
        ["/community", "Community"],
      ];
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="Consultify home">
            <span className="brand-mark" aria-hidden="true">
              c<span>·</span>
            </span>
            consultify<span className="brand-period">.</span>
          </Link>
          <button
            className="menu-toggle button secondary"
            aria-expanded={open}
            aria-controls="navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? "Close menu" : "Menu"}
          </button>
          <nav
            id="navigation"
            className={open ? "open" : ""}
            aria-label="Main navigation"
          >
            {links.map(([to, label]) => (
              <NavLink end={to === "/"} key={to} to={to}>
                {label}
              </NavLink>
            ))}
            {user ? (
              <button className="nav-logout" onClick={() => logout()}>
                Log out
              </button>
            ) : (
              <>
                <Link to="/login" className="login-link">
                  Sign in
                </Link>
                <Link to="/register" className="button small">
                  Get started <span aria-hidden="true">↗</span>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main id="main" tabIndex="-1">
        {notice && (
          <div className="container banner">
            <Notice>{notice}</Notice>
          </div>
        )}
        {error && (
          <div className="container banner">
            <Notice kind="error">
              {error} <button onClick={() => restore()}>Retry session</button>
            </Notice>
          </div>
        )}
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <Link className="brand" to="/">
              consultify.
            </Link>
            <p>Financial clarity, together.</p>
          </div>
          <div>
            <Link to="/advisors">Explore advisors</Link>
            <Link to="/community">Join the conversation</Link>
            <Link to="/register/advisor">Become an advisor</Link>
          </div>
          <p className="footer-note">
            Finance, thoughtfully connected.
            <br />
            Advisors register independently. Consultify does not verify
            professional qualifications.
          </p>
        </div>
      </footer>
    </>
  );
}
