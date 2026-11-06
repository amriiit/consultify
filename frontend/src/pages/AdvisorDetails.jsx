import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { advisorsApi } from "../api/advisors.api";
import { appointmentsApi } from "../api/appointments.api";
import { useAuth } from "../context/AuthContext";
import { useResource } from "../hooks/useResource";
import {
  Alert,
  Empty,
  Field,
  ResourceState,
  Submit,
} from "../components/common/UI";
import { date, fee, formValues, initials } from "../utils/format";
export default function AdvisorDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const resource = useResource(async () => {
    const [profile, reviews] = await Promise.all([
      advisorsApi.detail(id),
      advisorsApi.reviews(id),
    ]);
    return { ...profile, ...reviews };
  }, [id]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  async function book(event) {
    event.preventDefault();
    const values = formValues(event);
    const form = event.currentTarget;
    setError("");
    setSuccess("");
    const chosen = new Date(`${values.date}T${values.time}`);
    if (!Number.isFinite(chosen.getTime()) || chosen <= new Date())
      return setError("Choose a valid future date and time.");
    setBusy(true);
    try {
      await appointmentsApi.book({
        advisorId: id,
        scheduledAt: chosen.toISOString(),
        notes: values.notes.trim() || null,
      });
      setSuccess("Your request is pending. Track it in your appointments.");
      form.reset();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const a = resource.data?.advisor;
  return (
    <div className="container section">
      <Link className="back-link" to="/advisors">
        ← All advisors
      </Link>
      <ResourceState resource={resource}>
        {a && (
          <>
            <div className="detail-grid">
              <div>
                <section className="profile-heading">
                  <div className="avatar large">{initials(a.name)}</div>
                  <p className="eyebrow">Finance advisor</p>
                  <h1>{a.name}</h1>
                  <p className="lede">{a.specialization}</p>
                  <div className="profile-facts">
                    <span>{a.experience_years} years’ experience</span>
                    <span>
                      {resource.data.reviewCount
                        ? `${resource.data.averageRating.toFixed(1)} / 5 · ${resource.data.reviewCount} reviews`
                        : "No reviews yet"}
                    </span>
                  </div>
                </section>
                <section className="prose">
                  <h2>A professional perspective</h2>
                  <p className="preserve">{a.bio}</p>
                </section>
                <section className="review-section">
                  <h2>Conversations, reflected.</h2>
                  <p className="muted">Reviews from completed consultations.</p>
                  {resource.data.reviews.length ? (
                    resource.data.reviews.map((r) => (
                      <article className="review" key={r.id}>
                        <div className="row-between">
                          <strong>{r.reviewer_name}</strong>
                          <span className="rating">{r.rating} / 5</span>
                        </div>
                        {r.comment && <p className="preserve">{r.comment}</p>}
                        <small>{date(r.created_at)}</small>
                      </article>
                    ))
                  ) : (
                    <Empty title="A fresh perspective starts here.">
                      This advisor has no public reviews yet.
                    </Empty>
                  )}
                </section>
              </div>
              <aside className="booking-card">
                <p className="eyebrow">Your next step</p>
                <h2>Let’s make time.</h2>
                <p className="price">
                  {fee(a.consultation_fee)}
                  <small> / consultation</small>
                </p>
                <p className="muted">
                  Confirm the currency and consultation arrangements with your
                  advisor. No payment is collected here.
                </p>
                <hr />
                {user?.role === "USER" ? (
                  <>
                    <Alert>{error}</Alert>
                    <Alert success>{success}</Alert>
                    {success && (
                      <Link className="text-link" to="/user/appointments">
                        View appointments →
                      </Link>
                    )}
                    <form onSubmit={book}>
                      <Field label="Date" name="date" type="date" required />
                      <Field label="Time" name="time" type="time" required />
                      <p className="fine-print">
                        Times are in your local timezone:{" "}
                        {Intl.DateTimeFormat().resolvedOptions().timeZone}. This
                        is a request, subject to advisor confirmation;
                        availability is not checked.
                      </p>
                      <Field
                        label="What would you like to discuss? (optional)"
                        name="notes"
                        as="textarea"
                        rows="3"
                      />
                      <Submit busy={busy}>Request consultation</Submit>
                    </form>
                  </>
                ) : user ? (
                  <p>
                    Advisor accounts can manage incoming consultations from
                    their dashboard.
                  </p>
                ) : (
                  <Link
                    className="button"
                    to="/login"
                    state={{ from: `/advisors/${id}` }}
                  >
                    Log in to book
                  </Link>
                )}
              </aside>
            </div>
          </>
        )}
      </ResourceState>
    </div>
  );
}
