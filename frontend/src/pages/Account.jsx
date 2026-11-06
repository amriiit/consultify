import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Workspace } from "../components/layout/Layout";
import { PageHeader } from "../components/common/UI";
import { initials } from "../utils/format";
export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <Workspace>
      <PageHeader label="The essentials" title="Your account.">
        The details behind your conversations.
      </PageHeader>
      <section className="card account-card">
        <div className="avatar large">{initials(user.name)}</div>
        <dl>
          <dt>Full name</dt>
          <dd>{user.name}</dd>
          <dt>Email address</dt>
          <dd>{user.email}</dd>
          <dt>Account type</dt>
          <dd>{user.role === "ADVISOR" ? "Financial advisor" : "Member"}</dd>
        </dl>
        <p className="muted">
          Account editing is not available in Consultify V1.
        </p>
        <button
          className="button secondary"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Log out
        </button>
      </section>
    </Workspace>
  );
}
