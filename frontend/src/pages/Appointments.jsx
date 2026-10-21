import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { appointmentsApi } from "../api/appointments.api";
import { reviewsApi } from "../api/reviews.api";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../context/AuthContext";
import {
  ConfirmDialog,
  Empty,
  ErrorState,
  Field,
  Loading,
  Notice,
  PageTitle,
  Status,
} from "../components/common";
import { dateTime, fee } from "../utils/format";
function ReviewForm({ appointment }) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [submitted, setSubmitted] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const body = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setError("");
    try {
      await reviewsApi.create({
        appointmentId: appointment.id,
        rating: Number(body.rating),
        comment: body.comment,
      });
      setSubmitted(true);
      setOpen(false);
    } catch (e) {
      setError(
        e.status === 409
          ? "This appointment already has a review. Each consultation can be reviewed once."
          : e.message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="review-form">
      <Notice kind="success">
        {submitted &&
          "Your review has been submitted. Thank you for sharing your perspective."}
      </Notice>
      {!submitted && (
        <>
          <button
            className="button secondary small"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? "Close review form" : "Write a review"}
          </button>
          {open && (
            <form onSubmit={submit}>
              <h3>How was your consultation?</h3>
              <Notice kind="error">{error}</Notice>
              <Field label="Rating">
                <select name="rating" defaultValue="" required>
                  <option value="" disabled>
                    Choose a rating
                  </option>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option value={r} key={r}>
                      {r} out of 5
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Your review (optional)">
                <textarea name="comment" rows={3} />
              </Field>
              <button className="button small" disabled={busy}>
                {busy ? "Submitting…" : "Submit review"}
              </button>
              <p className="fineprint">
                One review per completed consultation. Your name and review will
                be public.
              </p>
            </form>
          )}
        </>
      )}
    </div>
  );
}
export default function Appointments() {
  const { user } = useAuth();
  const advisor = user.role === "ADVISOR";
  const [filter, setFilter] = useState("ALL"),
    [action, setAction] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const load = useCallback(
    (signal) => appointmentsApi.list(advisor, signal),
    [advisor],
  );
  const resource = useResource(load);
  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (action.status) await appointmentsApi.status(action.id, action.status);
      else await appointmentsApi.cancel(action.id);
      setMessage(
        action.status
          ? "Appointment status updated."
          : "Appointment cancelled.",
      );
      setAction(null);
      await resource.reload();
    } catch (e) {
      setError(e.message);
      setAction(null);
      await resource.reload();
    } finally {
      setBusy(false);
    }
  }
  const appointments = resource.data?.appointments || [],
    visible = appointments.filter(
      (a) => filter === "ALL" || a.status === filter,
    );
  return (
    <div className="container section">
      <PageTitle
        eyebrow={
          advisor ? "Your consultation workspace" : "Your next conversations"
        }
        title={advisor ? "Incoming appointments" : "My appointments"}
        action={
          !advisor && (
            <Link className="button" to="/advisors">
              Find an advisor ↗
            </Link>
          )
        }
      >
        {advisor
          ? "Review incoming requests and guide each consultation through confirmation and completion."
          : "Keep track of your requests, upcoming conversations, and completed consultations."}
      </PageTitle>
      <Notice kind="error">{error}</Notice>
      <Notice kind="success">{message}</Notice>
      <div className="tabs" aria-label="Filter appointments">
        {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map(
          (status) => (
            <button
              key={status}
              aria-pressed={filter === status}
              onClick={() => setFilter(status)}
            >
              {status === "ALL"
                ? "All appointments"
                : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ),
        )}
      </div>
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <ErrorState error={resource.error} retry={resource.reload} />
      ) : !visible.length ? (
        <Empty
          title={
            filter === "ALL"
              ? "No appointments just yet."
              : `No ${filter.toLowerCase()} appointments.`
          }
        >
          {advisor ? (
            "Consultation requests will appear here when someone books your profile."
          ) : (
            <>
              Find an advisor and make space for your questions.{" "}
              <Link to="/advisors">Explore advisors</Link>
            </>
          )}
        </Empty>
      ) : (
        <div className="appointment-list">
          {visible.map((a) => (
            <article className="card appointment-card" key={a.id}>
              <div className="row spread">
                <div>
                  <span className="eyebrow">
                    {advisor ? "Consultation with" : a.specialization}
                  </span>
                  <h2>
                    {advisor ? (
                      a.user_name
                    ) : (
                      <Link to={`/advisors/${a.advisor_id}`}>
                        {a.advisor_name}
                      </Link>
                    )}
                  </h2>
                </div>
                <Status value={a.status} />
              </div>
              <p className="appointment-time">
                {dateTime(a.scheduled_at)}{" "}
                <span className="muted">· your local time</span>
              </p>
              {!advisor && (
                <p className="muted">
                  Consultation fee: {fee(a.consultation_fee)}
                </p>
              )}
              {a.notes && (
                <div className="appointment-notes">
                  <span className="eyebrow">Consultation notes</span>
                  <p className="preserve">{a.notes}</p>
                </div>
              )}
              <div className="actions">
                {advisor && ["PENDING", "CONFIRMED"].includes(a.status) && (
                  <button
                    className="button small"
                    onClick={() =>
                      setAction({
                        id: a.id,
                        status:
                          a.status === "PENDING" ? "CONFIRMED" : "COMPLETED",
                        title:
                          a.status === "PENDING"
                            ? "Confirm this appointment?"
                            : "Mark this consultation completed?",
                        description:
                          a.status === "PENDING"
                            ? "The user will see this appointment as confirmed."
                            : "Only mark a consultation completed after it has taken place. This status cannot be undone.",
                        label:
                          a.status === "PENDING"
                            ? "Confirm appointment"
                            : "Mark completed",
                      })
                    }
                  >
                    {a.status === "PENDING"
                      ? "Confirm appointment"
                      : "Mark completed"}
                  </button>
                )}
                {!advisor && ["PENDING", "CONFIRMED"].includes(a.status) && (
                  <button
                    className="button secondary small"
                    onClick={() =>
                      setAction({
                        id: a.id,
                        title: "Cancel this appointment?",
                        description:
                          "Cancellation is final. You can request a new appointment later.",
                        label: "Cancel appointment",
                        danger: true,
                      })
                    }
                  >
                    Cancel appointment
                  </button>
                )}
              </div>
              {!advisor && a.status === "COMPLETED" && (
                <ReviewForm appointment={a} />
              )}
            </article>
          ))}
        </div>
      )}
      {action && (
        <ConfirmDialog
          action={action}
          busy={busy}
          onCancel={() => setAction(null)}
          onConfirm={confirm}
        />
      )}
    </div>
  );
}
