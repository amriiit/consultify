import { useCallback, useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { communityApi } from "../api/community.api";
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
} from "../components/common";
import { SearchBar } from "./Advisors";
import { countLabel, date, initials } from "../utils/format";
export function CommunityFeed() {
  const [params, setParams] = useSearchParams(),
    { user } = useAuth();
  const search = params.get("search") || "";
  const load = useCallback(
    (signal) => communityApi.list({ domain: "FINANCE", search }, signal),
    [search],
  );
  const { data, loading, error, reload } = useResource(load);
  return (
    <div className="container section">
      <PageTitle
        eyebrow="Shared questions. Different perspectives."
        title="Let’s talk about money."
        action={
          <Link
            className="button"
            to={user ? "/community/new" : "/login"}
            state={user ? undefined : { from: "/community/new" }}
          >
            Start a discussion ↗
          </Link>
        }
      >
        A space for financial questions, lived experiences, and learning from
        one another.
      </PageTitle>
      <SearchBar
        search={search}
        onSearch={(s) => setParams(s ? { search: s } : {})}
        placeholder="Search discussion titles and content"
      />
      <div className="list-caption">
        <span>
          {loading
            ? "Finding discussions…"
            : `${countLabel(data?.posts.length || 0, "discussion")}${search ? " matching your search" : ""}`}
        </span>
        <span>Finance community</span>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} retry={reload} />
      ) : data.posts.length ? (
        <div className="discussion-list">
          {data.posts.map((p) => (
            <article className="card discussion-card" key={p.id}>
              <div className="row spread">
                <div className="author">
                  <span className="avatar small-avatar">
                    {initials(p.author_name)}
                  </span>
                  <span>
                    {p.author_name} <small>· {date(p.created_at)}</small>
                  </span>
                </div>
                <span className="tag">Finance</span>
              </div>
              <h2>
                <Link to={`/community/${p.id}`}>{p.title}</Link>
              </h2>
              <p className="bio-preview">{p.content}</p>
              <div className="row spread discussion-meta">
                <span>
                  {countLabel(p.comment_count, "comment")}{" "}
                  <span aria-hidden="true">·</span> {Number(p.helpful_count)}{" "}
                  helpful
                </span>
                <Link to={`/community/${p.id}`} className="text-link">
                  Join the conversation →
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title={
            search
              ? "No discussions matched your search."
              : "Every good discussion starts with a question."
          }
        >
          {search
            ? "Try another keyword or clear your search."
            : "Be the first to share a financial question with the community."}
        </Empty>
      )}
    </div>
  );
}
export function NewPost() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate();
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const body = Object.fromEntries(new FormData(e.currentTarget));
    setError("");
    if (!body.title.trim() || !body.content.trim()) {
      setError("Enter a title and content for your discussion.");
      return;
    }
    setBusy(true);
    try {
      const { post } = await communityApi.create(body);
      navigate(`/community/${post.id}`, {
        state: {
          message: "Your discussion is live. Welcome to the conversation.",
        },
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container section narrow">
      <Link className="back-link" to="/community">
        ← Community
      </Link>
      <PageTitle eyebrow="Bring your questions" title="Start a conversation.">
        Be specific, be thoughtful, and leave out private financial information.
      </PageTitle>
      <section className="card form-card">
        <Notice kind="error">{error}</Notice>
        <form onSubmit={submit}>
          <Field label="Domain">
            <input value="FINANCE" readOnly />
          </Field>
          <Field
            label="Discussion title"
            hint="Give your question a clear title. Up to 200 characters."
          >
            <input
              name="title"
              required
              maxLength={200}
              placeholder="What would you like to explore?"
            />
          </Field>
          <Field label="Your discussion">
            <textarea
              name="content"
              required
              rows={8}
              placeholder="Share some context and the questions on your mind."
            />
          </Field>
          <div className="actions">
            <button className="button" disabled={busy}>
              {busy ? "Publishing…" : "Publish discussion"}
            </button>
            <Link className="text-link" to="/community">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
export function PostDetail() {
  const { id } = useParams(),
    { user } = useAuth(),
    navigate = useNavigate(),
    location = useLocation();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [action, setAction] = useState(null),
    [helped, setHelped] = useState(false);
  useEffect(() => {
    setHelped(false);
    setMessage(location.state?.message || "");
    setError("");
  }, [id, location.key]);
  const load = useCallback(
    async (signal) => {
      const [p, c] = await Promise.all([
        communityApi.detail(id, signal),
        communityApi.comments(id, signal),
      ]);
      return { ...p, ...c };
    },
    [id],
  );
  const resource = useResource(load);
  async function addComment(e) {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget,
      content = new FormData(form).get("content");
    setError("");
    setMessage("");
    if (!content.trim()) {
      setError("Write a comment before posting.");
      return;
    }
    setBusy(true);
    try {
      await communityApi.comment(id, content);
      form.reset();
      setMessage("Your comment has been added.");
      await resource.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function helpful() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await communityApi.helpful(id);
      setHelped(true);
      setMessage("Thank you. You marked this discussion helpful.");
      await resource.reload();
    } catch (e) {
      if (e.status === 409) {
        setHelped(true);
        setMessage("You have already marked this discussion helpful.");
        await resource.reload();
      } else setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (action.post) {
        await communityApi.deletePost(id);
        navigate("/community");
      } else {
        await communityApi.deleteComment(action.id);
        setMessage("Your comment has been deleted.");
        await resource.reload();
      }
      setAction(null);
    } catch (e) {
      setError(e.message);
      setAction(null);
    } finally {
      setBusy(false);
    }
  }
  if (resource.loading)
    return (
      <div className="container section">
        <Loading />
      </div>
    );
  if (resource.error)
    return <ErrorState error={resource.error} retry={resource.reload} />;
  const { post: p, comments } = resource.data;
  return (
    <div className="container section narrow">
      <Link className="back-link" to="/community">
        ← All discussions
      </Link>
      <Notice kind="error">{error}</Notice>
      <Notice kind="success">{message}</Notice>
      <article className="card post-detail">
        <span className="tag">Finance community</span>
        <h1>{p.title}</h1>
        <div className="author">
          <span className="avatar small-avatar">{initials(p.author_name)}</span>
          <span>
            {p.author_name} <small>· {date(p.created_at)}</small>
          </span>
        </div>
        <p className="post-content preserve">{p.content}</p>
        <div className="row spread post-actions">
          <div>
            <span>
              {Number(p.helpful_count)} helpful ·{" "}
              {countLabel(p.comment_count, "comment")}
            </span>
            {user ? (
              <button
                className="button secondary small"
                disabled={busy || helped}
                onClick={helpful}
              >
                {helped ? "Marked helpful" : "Mark helpful"}
              </button>
            ) : (
              <Link to="/login" state={{ from: `/community/${id}` }}>
                Sign in to mark helpful
              </Link>
            )}
          </div>
          {user?.id === p.author_id && (
            <button
              className="text-link destructive"
              onClick={() =>
                setAction({
                  post: true,
                  title: "Delete this discussion?",
                  description:
                    "Your post and all its comments and helpful votes will be permanently removed.",
                  label: "Delete discussion",
                  danger: true,
                })
              }
            >
              Delete discussion
            </button>
          )}
        </div>
      </article>
      <section className="comments-section">
        <div className="section-heading">
          <h2>Join the conversation</h2>
          <span className="muted">
            {countLabel(comments.length, "comment")}
          </span>
        </div>
        {comments.length ? (
          comments.map((c) => (
            <article className="comment card" key={c.id}>
              <div className="row spread">
                <strong>{c.author_name}</strong>
                <small className="muted">{date(c.created_at)}</small>
              </div>
              <p className="preserve">{c.content}</p>
              {user?.id === c.author_id && (
                <button
                  className="text-link destructive"
                  onClick={() =>
                    setAction({
                      id: c.id,
                      title: "Delete your comment?",
                      description: "This comment will be permanently removed.",
                      label: "Delete comment",
                      danger: true,
                    })
                  }
                >
                  Delete comment
                </button>
              )}
            </article>
          ))
        ) : (
          <p className="muted">No comments yet. Share the first perspective.</p>
        )}
        {user ? (
          <form className="card form-card" onSubmit={addComment}>
            <Field label="Your comment">
              <textarea
                name="content"
                rows={4}
                required
                placeholder="Add a thoughtful perspective…"
              />
            </Field>
            <button className="button" disabled={busy}>
              {busy ? "Please wait…" : "Post comment"}
            </button>
          </form>
        ) : (
          <div className="note-card">
            <h3>Your perspective is welcome.</h3>
            <Link to="/login" state={{ from: `/community/${id}` }}>
              Sign in to add a comment →
            </Link>
          </div>
        )}
      </section>
      {action && (
        <ConfirmDialog
          action={action}
          busy={busy}
          onCancel={() => setAction(null)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}
