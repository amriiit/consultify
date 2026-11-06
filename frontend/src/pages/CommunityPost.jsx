import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { communityApi } from "../api/community.api";
import { useAuth } from "../context/AuthContext";
import { useResource } from "../hooks/useResource";
import {
  Alert,
  ConfirmButton,
  Empty,
  Field,
  ResourceState,
  Submit,
} from "../components/common/UI";
import { count, date, formValues, initials } from "../utils/format";
export default function CommunityPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const resource = useResource(async () => {
    const [post, comments] = await Promise.all([
      communityApi.detail(id),
      communityApi.comments(id),
    ]);
    return { ...post, ...comments };
  }, [id]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const p = resource.data?.post;
  async function action(fn, message, refresh = true) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await fn();
      setSuccess(message);
      if (refresh) await resource.reload();
      return true;
    } catch (e) {
      setError(
        e.status === 409
          ? "You have already marked this discussion as helpful. A helpful vote can only be added once."
          : e.message,
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function comment(event) {
    event.preventDefault();
    const values = formValues(event);
    const form = event.currentTarget;
    if (!values.content.trim())
      return setError("Please write a comment before posting.");
    if (
      await action(
        () => communityApi.comment(id, values.content.trim()),
        "Your comment has been added.",
      )
    )
      form.reset();
  }
  return (
    <div className="container section narrow">
      <Link className="back-link" to="/community">
        ← All discussions
      </Link>
      <ResourceState resource={resource}>
        {p && (
          <>
            <article className="discussion">
              <p className="eyebrow">Finance / Community</p>
              <h1>{p.title}</h1>
              <div className="post-author">
                <span className="avatar mini">{initials(p.author_name)}</span>
                <span>
                  {p.author_name}
                  <small>{date(p.created_at)}</small>
                </span>
              </div>
              <p className="discussion-content preserve">{p.content}</p>
              <div className="discussion-actions">
                <span>
                  {count(p.helpful_count)} found helpful ·{" "}
                  {count(p.comment_count)} comments
                </span>
                {user ? (
                  <button
                    className="button secondary small"
                    disabled={busy}
                    onClick={() =>
                      action(
                        () => communityApi.helpful(id),
                        "Thank you for recognizing a helpful perspective.",
                      )
                    }
                  >
                    Mark helpful
                  </button>
                ) : (
                  <Link to="/login" state={{ from: `/community/${id}` }}>
                    Log in to contribute
                  </Link>
                )}
                {user?.id === p.author_id && (
                  <ConfirmButton
                    busy={busy}
                    message="Delete this discussion and all its comments?"
                    onConfirm={async () => {
                      if (
                        await action(
                          () => communityApi.deletePost(id),
                          "",
                          false,
                        )
                      )
                        navigate("/community");
                    }}
                  >
                    Delete discussion
                  </ConfirmButton>
                )}
              </div>
            </article>
            <Alert>{error}</Alert>
            <Alert success>{success}</Alert>
            <section className="comments">
              <h2>
                The conversation{" "}
                <span className="muted">({resource.data.comments.length})</span>
              </h2>
              {resource.data.comments.length ? (
                resource.data.comments.map((c) => (
                  <article className="comment" key={c.id}>
                    <div className="row-between">
                      <strong>{c.author_name}</strong>
                      <small>{date(c.created_at)}</small>
                    </div>
                    <p className="preserve">{c.content}</p>
                    {user?.id === c.author_id && (
                      <ConfirmButton
                        busy={busy}
                        message="Delete your comment?"
                        onConfirm={() =>
                          action(
                            () => communityApi.deleteComment(c.id),
                            "Your comment has been deleted.",
                          )
                        }
                      >
                        Delete comment
                      </ConfirmButton>
                    )}
                  </article>
                ))
              ) : (
                <Empty title="An open invitation.">
                  Be the first to add a thoughtful perspective.
                </Empty>
              )}
              {user ? (
                <form className="card" onSubmit={comment}>
                  <Field
                    label="Add your perspective"
                    name="content"
                    as="textarea"
                    rows="4"
                    required
                  />
                  <Submit busy={busy}>Post comment</Submit>
                </form>
              ) : (
                <p className="card">
                  <Link to="/login" state={{ from: `/community/${id}` }}>
                    Log in
                  </Link>{" "}
                  to join the conversation.
                </p>
              )}
            </section>
          </>
        )}
      </ResourceState>
    </div>
  );
}
