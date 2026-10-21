import { useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { appointmentsApi } from "../api/appointments.api";
import { advisorsApi } from "../api/advisors.api";
import { useResource } from "../hooks/useResource";
import {
  Empty,
  ErrorState,
  Loading,
  PageTitle,
  Status,
} from "../components/common";
import { dateTime } from "../utils/format";
export function Dashboard() {
  const { user } = useAuth(),
    advisor = user.role === "ADVISOR";
  const load = useCallback(
    async (signal) => {
      const list = await appointmentsApi.list(advisor, signal);
      const own = advisor
        ? (await advisorsApi.list({}, signal)).advisors.find(
            (a) => a.user_id === user.id,
          )
        : null;
      return { ...list, own };
    },
    [advisor, user.id],
  );
  const { data, loading, error, reload } = useResource(load);
  return (
    <div className="container section">
      <PageTitle
        eyebrow={advisor ? "Your advisor workspace" : "Your personal workspace"}
        title={`Good to see you, ${user.name.split(" ")[0]}.`}
      >
        A little perspective on your next conversations.
      </PageTitle>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} retry={reload} />
      ) : (
        <>
          {advisor && !data.own && (
            <div className="onboarding">
              <div>
                <h2>Your professional journey starts here.</h2>
                <p>
                  Create your public profile so people can discover and book
                  you.
                </p>
              </div>
              <Link className="button" to="/advisor/profile">
                Create your profile ↗
              </Link>
            </div>
          )}
          <div className="stats-grid">
            {[
              ["PENDING", "Awaiting confirmation"],
              ["CONFIRMED", "Confirmed consultations"],
              ["COMPLETED", "Completed conversations"],
            ].map(([status, label]) => (
              <div className="stat card" key={status}>
                <span className="eyebrow">{label}</span>
                <strong>
                  {data.appointments.filter((a) => a.status === status).length}
                </strong>
              </div>
            ))}
          </div>
          <div className="section-heading">
            <h2>Your upcoming conversations</h2>
            <Link
              className="text-link"
              to={advisor ? "/advisor/appointments" : "/user/appointments"}
            >
              View all appointments →
            </Link>
          </div>
          {data.appointments.filter((a) =>
            ["PENDING", "CONFIRMED"].includes(a.status),
          ).length ? (
            <div className="card dashboard-appointments">
              {data.appointments
                .filter((a) => ["PENDING", "CONFIRMED"].includes(a.status))
                .sort(
                  (a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at),
                )
                .slice(0, 3)
                .map((a) => (
                  <div className="row spread" key={a.id}>
                    <div>
                      <strong>{advisor ? a.user_name : a.advisor_name}</strong>
                      <p className="muted">{dateTime(a.scheduled_at)}</p>
                    </div>
                    <Status value={a.status} />
                  </div>
                ))}
            </div>
          ) : (
            <Empty title="Your next conversation is ahead.">
              {advisor ? (
                "New requests will appear here."
              ) : (
                <Link to="/advisors">Explore financial advisors →</Link>
              )}
            </Empty>
          )}
          <div className="quick-grid">
            <Link
              className="note-card"
              to={advisor ? "/advisor/profile" : "/advisors"}
            >
              <span className="eyebrow">
                {advisor ? "Professional presence" : "Find your perspective"}
              </span>
              <h2>
                {advisor
                  ? "Your profile, thoughtfully presented."
                  : "Make room for your questions."}{" "}
                ↗
              </h2>
              <p>
                {advisor
                  ? "Manage your bio, specialization and consultation fee."
                  : "Discover advisors and explore their experience."}
              </p>
            </Link>
            <Link className="note-card light" to="/community">
              <span className="eyebrow">The community</span>
              <h2>There’s something to learn, together. ↗</h2>
              <p>Ask a question or add your perspective to the conversation.</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
export function Account() {
  const { user } = useAuth();
  return (
    <div className="container section narrow">
      <PageTitle eyebrow="Your Consultify identity" title="My account">
        Your account details, restored securely through the server.
      </PageTitle>
      <section className="card form-card">
        <dl className="account-details">
          <dt>Full name</dt>
          <dd>{user.name}</dd>
          <dt>Email address</dt>
          <dd>{user.email}</dd>
          <dt>Account role</dt>
          <dd>{user.role}</dd>
        </dl>
        <p className="fineprint">
          Account editing and password recovery are not available in V1. Use Log
          out to end this browser session.
        </p>
      </section>
    </div>
  );
}
