import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { communityApi } from "../api/community.api";
import { Alert, Field, PageHeader, Submit } from "../components/common/UI";
import { formValues } from "../utils/format";
export default function CreatePost() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const values = formValues(event);
    if (!values.title.trim() || !values.content.trim())
      return setError("Give your discussion a title and some context.");
    setError("");
    setBusy(true);
    try {
      const { post } = await communityApi.create({
        domain: "FINANCE",
        title: values.title.trim(),
        content: values.content.trim(),
      });
      navigate(`/community/${post.id}`);
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
      <PageHeader label="Bring a new perspective" title="Start a conversation.">
        A clear question is a good beginning. Add enough context to help others
        contribute.
      </PageHeader>
      <section className="card">
        <Alert>{error}</Alert>
        <form onSubmit={submit}>
          <Field label="Domain" name="domain" value="FINANCE" readOnly />
          <Field
            label="Discussion title"
            name="title"
            maxLength="200"
            required
            placeholder="What’s on your mind?"
          />
          <Field
            label="Your question or perspective"
            name="content"
            as="textarea"
            rows="9"
            required
          />
          <p className="fine-print">
            Your discussion will be public. Keep personal and confidential
            financial details private.
          </p>
          <Submit busy={busy}>Publish discussion</Submit>
        </form>
      </section>
    </div>
  );
}
