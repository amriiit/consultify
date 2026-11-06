import { Link } from "react-router-dom";
import { useState } from "react";
export function Icon({ name = "arrow", ...props }) {
  const paths = {
    arrow: "M5 12h14m-6-6 6 6-6 6",
    search: "m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    calendar: "M4 5h16v16H4zM8 2v6m8-6v6M4 11h16",
    people:
      "M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3m20 0v-3a4 4 0 0 0-3-3.87M13 2.13a4 4 0 0 1 0 7.75M13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    message: "M21 15a3 3 0 0 1-3 3H8l-5 4V5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3z",
    check: "m5 12 4 4L19 6",
    plus: "M12 5v14M5 12h14",
    close: "m6 6 12 12M6 18 18 6",
  };
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name] || paths.arrow} />
    </svg>
  );
}
export function Mark() {
  return (
    <svg
      className="brand-mark"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M30 7H19a13 13 0 1 0 0 26h11M29 16H19a4 4 0 0 0 0 8h6"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path d="m28 25 7 7-7 7" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}
export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Consultify home">
      <Mark />
      <span>
        consultify<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
export function PageHeader({ label, title, children, action }) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{label}</p>
        <h1>{title}</h1>
        {children && <p className="lede">{children}</p>}
      </div>
      {action}
    </header>
  );
}
export function Alert({ children, success = false }) {
  return children ? (
    <div
      className={`alert ${success ? "success" : ""}`}
      role={success ? "status" : "alert"}
    >
      {children}
    </div>
  ) : null;
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="spinner" /> A moment of clarity is on its way…
    </div>
  );
}
export function ResourceState({ resource, children }) {
  if (resource.loading && resource.data === null) return <Loading />;
  if (resource.error)
    return (
      <div className="card">
        <Alert>{resource.error}</Alert>
        <button className="button secondary" onClick={resource.reload}>
          Try again
        </button>
      </div>
    );
  return children;
}
export function Empty({ title, children, to, action }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name="message" />
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
      {to && (
        <Link className="button secondary" to={to}>
          {action}
          <Icon />
        </Link>
      )}
    </div>
  );
}
export function Field({ label, name, as = "input", hint, ...props }) {
  const Tag = as;
  return (
    <label className="field">
      <span>{label}</span>
      <Tag name={name} {...props} />
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Password({ confirm = false, register = false }) {
  const [show, setShow] = useState(false);
  return (
    <label className="field">
      <span>{confirm ? "Confirm password" : "Password"}</span>
      <span className="password">
        <input
          name={confirm ? "confirm" : "password"}
          type={show ? "text" : "password"}
          autoComplete={register ? "new-password" : "current-password"}
          required
          minLength={register ? 12 : undefined}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={`${show ? "Hide" : "Show"} ${confirm ? "confirm password" : "password"}`}
        >
          {show ? "Hide" : "Show"}
        </button>
      </span>
      {register && !confirm && (
        <small>At least 12 characters, up to 72 UTF-8 bytes.</small>
      )}
    </label>
  );
}
export function Submit({ busy, children }) {
  return (
    <button className="button" type="submit" disabled={busy}>
      {busy ? "Please wait…" : children}
      {!busy && <Icon />}
    </button>
  );
}
export function ConfirmButton({
  children,
  onConfirm,
  busy,
  message = "This action cannot be undone.",
}) {
  const [open, setOpen] = useState(false);
  return open ? (
    <div className="confirm-inline" role="group" aria-label="Confirm action">
      <p>{message}</p>
      <button
        className="button danger small"
        disabled={busy}
        onClick={async () => {
          await onConfirm();
          setOpen(false);
        }}
      >
        Confirm
      </button>
      <button
        className="button secondary small"
        disabled={busy}
        onClick={() => setOpen(false)}
      >
        Keep it
      </button>
    </div>
  ) : (
    <button
      className="text-button danger-text"
      disabled={busy}
      onClick={() => setOpen(true)}
    >
      {children}
    </button>
  );
}
export function Status({ value }) {
  return (
    <span className={`status ${value.toLowerCase()}`}>
      {value.toLowerCase()}
    </span>
  );
}
