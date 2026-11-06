import { Link } from "react-router-dom";
import { advisorsApi } from "../api/advisors.api";
import { appointmentsApi } from "../api/appointments.api";
import { useAuth } from "../context/AuthContext";
import { useResource } from "../hooks/useResource";
import { Workspace } from "../components/layout/Layout";
import {
  Empty,
  Icon,
  PageHeader,
  ResourceState,
  Status,
} from "../components/common/UI";
import { dateTime } from "../utils/format";
export default function Dashboard() {
  const { user } = useAuth();
  const advisor = user.role === "ADVISOR";
  const resource = useResource(async () => {
    const appointments = await appointmentsApi.list(user.role);
    if (!advisor) return appointments;
    const { advisors } = await advisorsApi.list();
    const profile = advisors.find((a) => a.user_id === user.id);
    const reviews = profile ? await advisorsApi.reviews(profile.id) : null;
    return { ...appointments, profile, reviews };
  }, [user.id]);
  const appointments = resource.data?.appointments || [];
  const upcoming = appointments
    .filter((a) => ["PENDING", "CONFIRMED"].includes(a.status))
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  return (
    <Workspace>
      <PageHeader
        label={advisor ? "Advisor overview" : "Your personal overview"}
        title={`Welcome, ${user.name.split(" ")[0]}.`}
      >
        A little perspective for what comes next.
      </PageHeader>
      <ResourceState resource={resource}>
        {resource.data && (
          <>
            {advisor && (
              <section className="profile-banner">
                <div>
                  <p className="eyebrow">Your professional presence</p>
                  <h2>
                    {resource.data.profile
                      ? "Your profile is live."
                      : "Introduce your perspective."}
                  </h2>
                  <p>
                    {resource.data.profile
                      ? resource.data.profile.specialization
                      : "Create a profile so people can discover your experience and request a consultation."}
                  </p>
                  {resource.data.reviews && (
                    <p>
                      {resource.data.reviews.reviewCount
                        ? `${resource.data.reviews.averageRating.toFixed(1)} / 5 from ${resource.data.reviews.reviewCount} reviews`
                        : "No public reviews yet."}
                    </p>
                  )}
                </div>
                <div className="actions">
                  <Link className="button small" to="/advisor/profile">
                    {resource.data.profile ? "Edit profile" : "Create profile"}
                    <Icon />
                  </Link>
                  {resource.data.profile && (
                    <Link
                      className="text-link"
                      to={`/advisors/${resource.data.profile.id}`}
                    >
                      Public profile →
                    </Link>
                  )}
                </div>
              </section>
            )}
            <div className="dashboard-summary">
              {[
                [
                  "Pending",
                  appointments.filter((a) => a.status === "PENDING").length,
                ],
                [
                  "Confirmed",
                  appointments.filter((a) => a.status === "CONFIRMED").length,
                ],
                [
                  "Completed",
                  appointments.filter((a) => a.status === "COMPLETED").length,
                ],
              ].map(([title, n]) => (
                <div key={title}>
                  <span>{title}</span>
                  <strong>{n}</strong>
                </div>
              ))}
            </div>
            <div className="section-heading">
              <h2>On the horizon.</h2>
              <Link
                className="text-link"
                to={advisor ? "/advisor/appointments" : "/user/appointments"}
              >
                All appointments
                <Icon />
              </Link>
            </div>
            {upcoming.length ? (
              <div className="upcoming-list">
                {upcoming.slice(0, 4).map((a) => (
                  <Link
                    key={a.id}
                    to={
                      advisor ? "/advisor/appointments" : "/user/appointments"
                    }
                  >
                    <div>
                      <strong>{advisor ? a.user_name : a.advisor_name}</strong>
                      <p>{dateTime(a.scheduled_at)}</p>
                    </div>
                    <Status value={a.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <Empty
                title="Your next conversation is ahead."
                to={advisor ? "/advisor/profile" : "/advisors"}
                action={advisor ? "Manage your profile" : "Find an advisor"}
              >
                {advisor
                  ? "New appointment requests will appear here."
                  : "Explore advisors and find someone to talk things through with."}
              </Empty>
            )}
            <div className="dashboard-community">
              <Icon name="message" />
              <div>
                <h3>Bring your questions to the community.</h3>
                <p>Explore ideas, share a perspective, and learn together.</p>
              </div>
              <Link className="text-link" to="/community">
                Explore
                <Icon />
              </Link>
            </div>
          </>
        )}
      </ResourceState>
    </Workspace>
  );
}
