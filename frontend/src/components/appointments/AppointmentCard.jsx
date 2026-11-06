import { useState } from "react";
import { Link } from "react-router-dom";
import { appointmentsApi } from "../../api/appointments.api";
import { reviewsApi } from "../../api/reviews.api";
import { Alert, ConfirmButton, Field, Status, Submit } from "../common/UI";
import { dateTime, formValues } from "../../utils/format";
export default function AppointmentCard({ appointment: a, advisor, reload }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reviewing, setReviewing] = useState(false);
  async function action(fn, message) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await fn();
      setSuccess(message);
      await reload();
    } catch (e) {
      setError(
        e.status === 409
          ? "A review already exists for this consultation. Each completed consultation can be reviewed once."
          : e.message,
      );
    } finally {
      setBusy(false);
    }
  }
  async function review(event) {
    event.preventDefault();
    const values = formValues(event);
    await action(
      () =>
        reviewsApi.create({
          appointmentId: a.id,
          rating: Number(values.rating),
          comment: values.comment.trim() || null,
        }),
      "Your review has been published.",
    );
  }
  return (
    <article className="appointment-card" data-testid="appointment">
      <div className="row-between">
        <div>
          <p className="eyebrow">
            {advisor ? "Consultation request" : a.specialization}
          </p>
          <h2>
            {advisor ? (
              a.user_name
            ) : (
              <Link to={`/advisors/${a.advisor_id}`}>{a.advisor_name}</Link>
            )}
          </h2>
        </div>
        <Status value={a.status} />
      </div>
      <p className="appointment-date">{dateTime(a.scheduled_at)}</p>
      <small className="muted">
        Your local time · {Intl.DateTimeFormat().resolvedOptions().timeZone}
      </small>
      {a.notes && <div className="appointment-notes preserve">{a.notes}</div>}
      <Alert>{error}</Alert>
      <Alert success>{success}</Alert>
      <div className="actions">
        {advisor && ["PENDING", "CONFIRMED"].includes(a.status) && (
          <button
            className="button small"
            disabled={busy}
            onClick={() =>
              action(
                () =>
                  appointmentsApi.status(
                    a.id,
                    a.status === "PENDING" ? "CONFIRMED" : "COMPLETED",
                  ),
                "Appointment updated.",
              )
            }
          >
            {a.status === "PENDING" ? "Confirm appointment" : "Mark completed"}
          </button>
        )}
        {!advisor && ["PENDING", "CONFIRMED"].includes(a.status) && (
          <ConfirmButton
            busy={busy}
            message="Cancel this consultation request?"
            onConfirm={() =>
              action(
                () => appointmentsApi.cancel(a.id),
                "Appointment cancelled.",
              )
            }
          >
            Cancel appointment
          </ConfirmButton>
        )}
        {!advisor && a.status === "COMPLETED" && (
          <button
            className="button secondary small"
            onClick={() => setReviewing(!reviewing)}
          >
            {reviewing ? "Close review form" : "Write a review"}
          </button>
        )}
      </div>
      {reviewing && (
        <form className="review-form" onSubmit={review}>
          <p className="muted">
            One review per completed consultation. If you already reviewed it,
            we’ll let you know.
          </p>
          <Field
            label="Rating"
            name="rating"
            as="select"
            required
            defaultValue="5"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option value={n} key={n}>
                {n} / 5
              </option>
            ))}
          </Field>
          <Field
            label="Your review (optional)"
            name="comment"
            as="textarea"
            rows="3"
          />
          <Submit busy={busy}>Publish review</Submit>
        </form>
      )}
    </article>
  );
}
