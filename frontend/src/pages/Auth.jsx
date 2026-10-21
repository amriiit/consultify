import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/auth.api";
import { Field, Notice } from "../components/common";
export default function AuthPage({ register = false, advisor = false }) {
  const auth = useAuth(),
    location = useLocation(),
    navigate = useNavigate();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const from = location.state?.from;
  const destination =
    typeof from === "string" &&
    from.startsWith("/") &&
    !from.startsWith("//") &&
    !["/login", "/register", "/register/advisor"].includes(from)
      ? from
      : "/dashboard";
  if (auth.user) return <Navigate to={destination} replace />;
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (register && values.password !== values.confirm) {
      setError("Your passwords don’t match. Please try again.");
      return;
    }
    if (register && new TextEncoder().encode(values.password).length > 72) {
      setError(
        "Password must be at most 72 UTF-8 bytes. Try fewer characters.",
      );
      return;
    }
    if (register && !values.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setBusy(true);
    try {
      if (register) {
        await authApi.register(
          { name: values.name, email: values.email, password: values.password },
          advisor,
        );
        navigate("/login", {
          replace: true,
          state: {
            message: "Your account is ready. Sign in to continue.",
            from,
          },
        });
      } else {
        await auth.login({ email: values.email, password: values.password });
        navigate(destination, { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container auth-layout section">
      <aside className="auth-aside">
        <span className="eyebrow">
          {advisor ? "Share what you know" : "A clearer way forward"}
        </span>
        <h1>
          {register
            ? advisor
              ? "Good conversations start with your perspective."
              : "Start your next financial chapter."
            : "Welcome back to your next chapter."}
        </h1>
        <p>
          {advisor
            ? "Create your profile, connect with people, and manage your consultation requests."
            : "Your advisors, your conversations, and your financial questions. All in one place."}
        </p>
        <span className="aside-line" />
      </aside>
      <section className="card auth-card">
        <span className="eyebrow">
          {register
            ? advisor
              ? "Advisor registration"
              : "Create an account"
            : "Your Consultify account"}
        </span>
        <h2>
          {register
            ? advisor
              ? "Join as an advisor"
              : "Let’s get you started"
            : "Sign in"}
        </h2>
        <p className="muted">
          {register ? "Already have an account? " : "New to Consultify? "}
          <Link to={register ? "/login" : "/register"}>
            {register ? "Sign in" : "Create an account"}
          </Link>
        </p>
        <Notice>{location.state?.message}</Notice>
        <Notice kind="error">{error}</Notice>
        <form onSubmit={submit}>
          {register && (
            <Field label="Full name">
              <input name="name" autoComplete="name" required maxLength={100} />
            </Field>
          )}
          <Field label="Email address">
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={255}
            />
          </Field>
          <Field
            label="Password"
            hint={
              register
                ? "At least 12 characters, at most 72 UTF-8 bytes. Spaces and case are preserved."
                : undefined
            }
          >
            <input
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              minLength={register ? 12 : undefined}
              required
            />
          </Field>
          {register && (
            <Field label="Confirm password">
              <input
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
              />
            </Field>
          )}
          <button className="button full" disabled={busy}>
            {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
          </button>
        </form>
        {register && (
          <p className="fineprint">
            {advisor ? (
              "Advisor accounts are self-service. Registration does not certify qualifications."
            ) : (
              <>
                Want to offer consultations?{" "}
                <Link to="/register/advisor">Register as an advisor</Link>.
              </>
            )}
          </p>
        )}
      </section>
    </div>
  );
}
