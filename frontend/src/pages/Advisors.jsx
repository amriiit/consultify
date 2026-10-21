import { useCallback, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { advisorsApi } from "../api/advisors.api";
import { appointmentsApi } from "../api/appointments.api";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../context/AuthContext";
import {
  Field,
  Notice,
  Loading,
  ErrorState,
  Empty,
  PageTitle,
} from "../components/common";
import { countLabel, date, dateTime, fee, initials } from "../utils/format";
export function SearchBar({ search, onSearch, placeholder }) {
  return (
    <form
      className="search-bar"
      key={search}
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(new FormData(e.currentTarget).get("search").trim());
      }}
    >
      <label className="search-input">
        <span className="sr-only">Search</span>
        <input
          type="search"
          name="search"
          placeholder={placeholder}
          defaultValue={search}
        />
      </label>
      <label className="domain-select">
        <span className="sr-only">Domain</span>
        <select aria-label="Domain">
          <option>Finance</option>
        </select>
      </label>
      <button className="button">Search</button>
      {search && (
        <button
          type="button"
          className="button secondary"
          onClick={() => onSearch("")}
        >
          Clear
        </button>
      )}
    </form>
  );
}
export function AdvisorCard({ advisor }) {
  return (
    <article className="card advisor-card">
      <div className="advisor-top">
        <span className="avatar">{initials(advisor.advisor_name)}</span>
        <span className="tag">Finance</span>
      </div>
      <h2>
        <Link to={`/advisors/${advisor.id}`}>{advisor.advisor_name}</Link>
      </h2>
      <p className="specialization">{advisor.specialization}</p>
      <p className="bio-preview">{advisor.bio}</p>
      <div className="advisor-facts">
        <span>
          <strong>{advisor.experience_years}</strong> years’ experience
        </span>
        <span>
          <strong>{fee(advisor.consultation_fee)}</strong> consultation fee
        </span>
      </div>
      <Link className="card-link" to={`/advisors/${advisor.id}`}>
        View profile & reviews <span aria-hidden="true">↗</span>
      </Link>
    </article>
  );
}
export function AdvisorDirectory() {
  const [params, setParams] = useSearchParams();
  const search = params.get("search") || "";
  const load = useCallback(
    (signal) => advisorsApi.list({ domain: "FINANCE", search }, signal),
    [search],
  );
  const { data, loading, error, reload } = useResource(load);
  return (
    <div className="container section">
      <PageTitle
        eyebrow="A conversation worth having"
        title="Find your financial perspective."
      >
        Explore advisors, their specializations, and the experiences shared by
        their clients.
      </PageTitle>
      <SearchBar
        search={search}
        onSearch={(value) => setParams(value ? { search: value } : {})}
        placeholder="Search by advisor name or specialization"
      />
      <div className="list-caption">
        <span>
          {loading
            ? "Finding advisors…"
            : `${countLabel(data?.advisors.length || 0, "advisor")}${search ? " matching your search" : " in Finance"}`}
        </span>
        <span>Independently registered profiles</span>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} retry={reload} />
      ) : data.advisors.length ? (
        <div className="card-grid">
          {data.advisors.map((a) => (
            <AdvisorCard key={a.id} advisor={a} />
          ))}
        </div>
      ) : (
        <Empty
          title={
            search
              ? "No advisors matched your search."
              : "A new community is taking shape."
          }
        >
          {search
            ? "Try a different name or specialization."
            : "Advisor profiles will appear here as they join."}
        </Empty>
      )}
    </div>
  );
}
export function ReviewList({ summary }) {
  return (
    <section className="review-section">
      <div className="section-heading">
        <h2>Client perspectives</h2>
        <span className="rating">
          {summary.reviewCount
            ? `${summary.averageRating.toFixed(1)} / 5 · ${countLabel(summary.reviewCount, "review")}`
            : "No reviews yet"}
        </span>
      </div>
      {summary.reviews.length ? (
        <div className="review-list">
          {summary.reviews.map((r) => (
            <article className="review" key={r.id}>
              <div className="row spread">
                <strong>{r.reviewer_name}</strong>
                <span className="rating">{r.rating} / 5</span>
              </div>
              {r.comment && <p className="preserve">{r.comment}</p>}
              <small className="muted">{date(r.created_at)}</small>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">
          Client reviews will appear after completed consultations.
        </p>
      )}
    </section>
  );
}
function BookingForm({ advisor }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(false),
    [selection, setSelection] = useState({ day: "", time: "" });
  const selected =
    selection.day && selection.time
      ? new Date(`${selection.day}T${selection.time}`)
      : null;
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (
      !selected ||
      !Number.isFinite(selected.getTime()) ||
      selected.getTime() <= Date.now()
    ) {
      setError("Choose a date and time in the future.");
      return;
    }
    const notes = new FormData(e.currentTarget).get("notes");
    setBusy(true);
    try {
      await appointmentsApi.book({
        advisorId: advisor.id,
        scheduledAt: selected.toISOString(),
        notes,
      });
      setSuccess(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (success)
    return (
      <div className="booking-success">
        <span className="eyebrow">Request received</span>
        <h2>Your next conversation is on its way.</h2>
        <p>Your appointment is pending until the advisor confirms.</p>
        <Link to="/user/appointments" className="button">
          View my appointments
        </Link>
        <button className="text-link" onClick={() => setSuccess(false)}>
          Request another appointment
        </button>
      </div>
    );
  return (
    <form onSubmit={submit}>
      <Notice kind="error">{error}</Notice>
      <div className="form-row">
        <Field label="Date">
          <input
            type="date"
            name="day"
            value={selection.day}
            onChange={(e) =>
              setSelection({ ...selection, day: e.target.value })
            }
            required
          />
        </Field>
        <Field label="Time">
          <input
            type="time"
            name="time"
            value={selection.time}
            onChange={(e) =>
              setSelection({ ...selection, time: e.target.value })
            }
            required
          />
        </Field>
      </div>
      <Field label="Notes (optional)">
        <textarea
          name="notes"
          rows={3}
          placeholder="What would you like to discuss?"
        />
      </Field>
      {selected && Number.isFinite(selected.getTime()) && (
        <p className="time-preview">
          Your local time: <strong>{dateTime(selected)}</strong>
        </p>
      )}
      <button className="button full" disabled={busy}>
        {busy ? "Requesting…" : "Request appointment"}
      </button>
      <p className="fineprint">
        Requests do not reserve an available time slot. The advisor must confirm
        your appointment.
      </p>
    </form>
  );
}
export function AdvisorDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const load = useCallback(
    async (signal) => {
      const [profile, summary] = await Promise.all([
        advisorsApi.detail(id, signal),
        advisorsApi.reviews(id, signal),
      ]);
      return { ...profile, summary };
    },
    [id],
  );
  const { data, loading, error, reload } = useResource(load);
  if (loading)
    return (
      <div className="container section">
        <Loading />
      </div>
    );
  if (error) return <ErrorState error={error} retry={reload} />;
  const a = data.advisor;
  return (
    <div className="container section">
      <Link className="back-link" to="/advisors">
        ← All financial advisors
      </Link>
      <div className="detail-grid">
        <div>
          <div className="profile-intro">
            <span className="avatar large">{initials(a.name)}</span>
            <span className="tag">Finance advisor</span>
            <h1>{a.name}</h1>
            <p className="lead">{a.specialization}</p>
            <div className="profile-stats">
              <span>{a.experience_years} years’ experience</span>
              <span>
                {data.summary.reviewCount
                  ? `${data.summary.averageRating.toFixed(1)} / 5 · ${countLabel(data.summary.reviewCount, "review")}`
                  : "No reviews yet"}
              </span>
            </div>
          </div>
          <section className="card prose">
            <h2>About {a.name.split(" ")[0]}</h2>
            <p className="preserve">{a.bio}</p>
            <p className="fineprint">
              Profile information is supplied by this advisor and is not
              independently verified by Consultify.
            </p>
          </section>
          <ReviewList summary={data.summary} />
        </div>
        <aside className="card booking-card">
          <span className="eyebrow">Make space for your questions</span>
          <h2>Start a conversation.</h2>
          <div className="booking-fee">
            <strong>{fee(a.consultation_fee)}</strong>
            <span>consultation fee</span>
          </div>
          {user?.role === "USER" ? (
            <BookingForm key={id} advisor={a} />
          ) : user ? (
            <p className="muted">
              Booking is available to USER accounts. Advisor accounts manage
              incoming appointments.
            </p>
          ) : (
            <>
              <p>Sign in with a user account to request a consultation.</p>
              <Link
                to="/login"
                state={{ from: `/advisors/${id}` }}
                className="button full"
              >
                Sign in to book
              </Link>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
export function AdvisorProfile() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const load = useCallback(
    async (signal) => {
      const { advisors } = await advisorsApi.list({}, signal);
      const profile = advisors.find((a) => a.user_id === user.id);
      const summary = profile
        ? await advisorsApi.reviews(profile.id, signal)
        : null;
      return { profile, summary };
    },
    [user.id],
  );
  const resource = useResource(load);
  if (resource.loading)
    return (
      <div className="container section">
        <Loading />
      </div>
    );
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.reload} />;
  const profile = resource.data.profile;
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const values = Object.fromEntries(new FormData(e.currentTarget));
    setError("");
    setMessage("");
    if (!values.bio.trim() || !values.specialization.trim()) {
      setError("Please enter a bio and specialization.");
      return;
    }
    const body = {
      bio: values.bio.trim(),
      specialization: values.specialization.trim(),
      experienceYears: Number(values.experienceYears),
      consultationFee: Number(values.consultationFee),
    };
    if (!profile) body.domain = "FINANCE";
    setBusy(true);
    try {
      await advisorsApi.save(body, !!profile);
      setMessage(
        profile
          ? "Your profile has been updated."
          : "Your professional profile is ready.",
      );
      await resource.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container section">
      <PageTitle
        eyebrow="Your professional presence"
        title={
          profile ? "Make your profile yours." : "Introduce your perspective."
        }
        action={
          profile && (
            <Link className="button secondary" to={`/advisors/${profile.id}`}>
              View public profile ↗
            </Link>
          )
        }
      >
        Help people understand your experience and the questions you can explore
        together.
      </PageTitle>
      <div className="detail-grid">
        <section className="card form-card">
          <Notice kind="error">{error}</Notice>
          <Notice kind="success">{message}</Notice>
          <form key={profile?.id || "new"} onSubmit={submit}>
            <Field label="Domain">
              <input value="FINANCE" readOnly />
            </Field>
            <Field label="Specialization">
              <input
                name="specialization"
                maxLength={150}
                defaultValue={profile?.specialization || ""}
                placeholder="e.g. Investment planning"
                required
              />
            </Field>
            <Field label="Professional bio">
              <textarea
                name="bio"
                rows={6}
                defaultValue={profile?.bio || ""}
                required
              />
            </Field>
            <div className="form-row">
              <Field label="Years of experience">
                <input
                  name="experienceYears"
                  type="number"
                  min="0"
                  max="2147483647"
                  step="1"
                  defaultValue={profile?.experience_years ?? 0}
                  required
                />
              </Field>
              <Field label="Consultation fee">
                <input
                  name="consultationFee"
                  type="number"
                  min="0"
                  max="99999999.99"
                  step="0.01"
                  defaultValue={profile?.consultation_fee ?? 0}
                  required
                />
              </Field>
            </div>
            <button className="button" disabled={busy}>
              {busy
                ? "Saving…"
                : profile
                  ? "Save profile"
                  : "Create professional profile"}
            </button>
          </form>
        </section>
        <aside>
          <div className="note-card">
            <span className="eyebrow">A thoughtful introduction</span>
            <h2>Be clear. Be yourself.</h2>
            <p>
              Describe your experience and areas of focus. Your profile is
              publicly visible once created.
            </p>
            <p className="fineprint">
              Registration is self-service. Consultify does not verify
              professional qualifications.
            </p>
          </div>
          {resource.data.summary && (
            <ReviewList summary={resource.data.summary} />
          )}
        </aside>
      </div>
    </div>
  );
}
