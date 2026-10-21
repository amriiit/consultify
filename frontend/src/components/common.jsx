import { cloneElement, useEffect, useId, useRef } from "react";
export function Field({ label, hint, children }) {
  const generated = useId(),
    id = children.props.id || generated;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, {
        id,
        "aria-describedby": hint
          ? `${id}-hint`
          : children.props["aria-describedby"],
      })}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}
export function Notice({ children, kind = "info" }) {
  return children ? (
    <div
      className={`notice ${kind}`}
      role={kind === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  ) : null;
}
export function Loading() {
  return (
    <div className="skeletons" role="status" aria-label="Loading">
      <span className="sr-only">Loading…</span>
      {[1, 2, 3].map((i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}
export function ErrorState({ error, retry }) {
  return (
    <div className="empty">
      <span className="eyebrow">Let’s try that again</span>
      <h2>
        {error?.status === 404
          ? "We couldn’t find that page."
          : "Something interrupted your request."}
      </h2>
      <p>{error?.message}</p>
      {retry && (
        <button className="button secondary" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function Empty({ title, children }) {
  return (
    <div className="empty">
      <div className="empty-mark" aria-hidden="true">
        —
      </div>
      <h2>{title}</h2>
      <div className="muted">{children}</div>
    </div>
  );
}
export function Status({ value }) {
  return (
    <span className={`status ${value.toLowerCase()}`}>
      {value.charAt(0) + value.slice(1).toLowerCase()}
    </span>
  );
}
export function PageTitle({ eyebrow, title, children, action }) {
  return (
    <div className="page-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {action}
    </div>
  );
}
export function ConfirmDialog({ action, busy, onCancel, onConfirm }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
      aria-labelledby="confirm-title"
    >
      <h2 id="confirm-title">{action.title}</h2>
      <p>{action.description}</p>
      <div className="actions">
        <button className="button secondary" onClick={onCancel} disabled={busy}>
          Keep as is
        </button>
        <button
          className={`button ${action.danger ? "danger" : ""}`}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? "Updating…" : action.label}
        </button>
      </div>
    </dialog>
  );
}
