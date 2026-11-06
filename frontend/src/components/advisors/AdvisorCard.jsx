import { Link } from "react-router-dom";
import { fee, initials } from "../../utils/format";
import { Icon } from "../common/UI";
export default function AdvisorCard({ advisor }) {
  return (
    <article className="advisor-card">
      <div className="advisor-card-top">
        <div className="avatar">{initials(advisor.advisor_name)}</div>
        <span className="eyebrow">Finance</span>
      </div>
      <h2>
        <Link to={`/advisors/${advisor.id}`}>{advisor.advisor_name}</Link>
      </h2>
      <p className="specialization">{advisor.specialization}</p>
      <p className="clamp-two">{advisor.bio}</p>
      <div className="advisor-meta">
        <span>{advisor.experience_years} years’ experience</span>
        <span>
          <strong>{fee(advisor.consultation_fee)}</strong> / consultation
        </span>
      </div>
      <Link className="card-link" to={`/advisors/${advisor.id}`}>
        View profile
        <Icon />
      </Link>
    </article>
  );
}
