import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth.api";
import { useAuth } from "../context/AuthContext";
import { Alert, Field, Mark, Password, Submit } from "../components/common/UI";
import { formValues, nonblank } from "../utils/format";
export default function Auth({ register = false, advisor = false }) {
  const { user, login, sessionError, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user && !loading) return <Navigate to="/dashboard" replace />;
  async function submit(event) {
    event.preventDefault();
    const values = formValues(event);
    setError("");
    if (!nonblank(values)) return setError("Please complete every field.");
    if (register && values.password !== values.confirm)
      return setError("Passwords do not match.");
    if (register && new TextEncoder().encode(values.password).length > 72)
      return setError(
        "Password must not exceed 72 UTF-8 bytes. Try fewer characters.",
      );
    setBusy(true);
    try {
      if (register) {
        await authApi.register(
          {
            name: values.name.trim(),
            email: values.email.trim(),
            password: values.password,
          },
          advisor,
        );
        navigate("/login", { state: { registered: true } });
      } else {
        await login({ email: values.email.trim(), password: values.password });
        const from = location.state?.from;
        navigate(
          from?.startsWith("/") && !from.startsWith("//") ? from : "/dashboard",
          { replace: true },
        );
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container auth-layout">
      <aside className="auth-story">
        <p className="eyebrow">
          {advisor
            ? "The professional perspective"
            : "The beginning of something clearer"}
        </p>
        <h2>
          {advisor ? (
            <>
              Your experience.
              <br />
              Someone’s next step.
            </>
          ) : (
            <>
              A good conversation
              <br />
              can change your
              <br />
              perspective.
            </>
          )}
        </h2>
        <div className="auth-symbol" aria-hidden="true">
          <Mark />
        </div>
        <p>
          {advisor
            ? "Create your advisor account, build your professional profile, and manage consultation requests in one place."
            : "A thoughtful space to find financial advisors and explore the questions that matter to you."}
        </p>
      </aside>
      <section className="auth-form">
        <p className="eyebrow">
          {register ? "Welcome to Consultify" : "Welcome back"}
        </p>
        <h1>
          {register
            ? advisor
              ? "Share your expertise."
              : "Start your next chapter."
            : "A fresh perspective awaits."}
        </h1>
        <p>
          {register
            ? advisor
              ? "Register as a financial advisor. You’ll create your public profile after logging in."
              : "Create your account to book consultations and join discussions."
            : "Log in to continue your conversations."}
        </p>
        <Alert success>
          {location.state?.registered && "Account created. You can now log in."}
        </Alert>
        <Alert>{error || (!register && sessionError)}</Alert>
        <form onSubmit={submit}>
          {register && (
            <Field
              label="Full name"
              name="name"
              autoComplete="name"
              required
              maxLength="100"
            />
          )}
          <Field
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength="255"
          />
          <Password register={register} />
          {register && <Password confirm register />}
          <Submit busy={busy}>{register ? "Create account" : "Log in"}</Submit>
        </form>
        <p className="auth-switch">
          {register ? (
            <>
              Already have an account? <Link to="/login">Log in</Link>
            </>
          ) : (
            <>
              New to Consultify? <Link to="/register">Create an account</Link>
            </>
          )}
        </p>
        {register && (
          <p className="auth-switch">
            {advisor ? (
              <>
                Looking for advice? <Link to="/register">Join as a member</Link>
              </>
            ) : (
              <>
                A financial professional?{" "}
                <Link to="/register/advisor">Join as an advisor</Link>
              </>
            )}
          </p>
        )}
      </section>
    </div>
  );
}
