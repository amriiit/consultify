import { useState } from "react";
import { Link } from "react-router-dom";
import { advisorsApi } from "../api/advisors.api";
import { useAuth } from "../context/AuthContext";
import { useResource } from "../hooks/useResource";
import { Workspace } from "../components/layout/Layout";
import {
  Alert,
  Field,
  PageHeader,
  ResourceState,
  Submit,
} from "../components/common/UI";
import { formValues } from "../utils/format";
export default function AdvisorProfile() {
  const { user } = useAuth();
  const resource = useResource(
    async () =>
      (await advisorsApi.list()).advisors.find((a) => a.user_id === user.id) ||
      null,
    [user.id],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function save(event) {
    event.preventDefault();
    const v = formValues(event);
    setError("");
    setSuccess("");
    if (!v.bio.trim() || !v.specialization.trim())
      return setError("Bio and specialization cannot be blank.");
    const body = {
      bio: v.bio.trim(),
      specialization: v.specialization.trim(),
      experienceYears: Number(v.experienceYears),
      consultationFee: Number(v.consultationFee),
    };
    setBusy(true);
    try {
      if (resource.data) await advisorsApi.update(body);
      else await advisorsApi.create({ ...body, domain: "FINANCE" });
      setSuccess("Your professional profile has been saved.");
      await resource.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const p = resource.data;
  return (
    <Workspace>
      <PageHeader
        label="Your professional presence"
        title="A perspective worth sharing."
      >
        Help people understand your experience and what you bring to a
        conversation.
      </PageHeader>
      <ResourceState resource={resource}>
        <section className="card">
          <div className="row-between">
            <h2>{p ? "Edit your profile" : "Create your profile"}</h2>
            {p && (
              <Link className="text-link" to={`/advisors/${p.id}`}>
                Public profile →
              </Link>
            )}
          </div>
          <p className="muted">
            Consultify V1 is focused on finance. Your profile is public and is
            not independently verified by Consultify.
          </p>
          <Alert>{error}</Alert>
          <Alert success>{success}</Alert>
          <form onSubmit={save} key={p?.id || "new"}>
            <Field label="Domain" name="domain" value="FINANCE" readOnly />
            <Field
              label="Specialization"
              name="specialization"
              required
              maxLength="150"
              defaultValue={p?.specialization || ""}
              placeholder="e.g. Retirement planning"
            />
            <Field
              label="Professional bio"
              name="bio"
              as="textarea"
              rows="6"
              required
              defaultValue={p?.bio || ""}
              placeholder="Tell people about your approach and experience."
            />
            <div className="form-grid">
              <Field
                label="Years of experience"
                name="experienceYears"
                type="number"
                min="0"
                max="2147483647"
                step="1"
                required
                defaultValue={p?.experience_years ?? ""}
              />
              <Field
                label="Consultation fee"
                name="consultationFee"
                type="number"
                min="0"
                max="99999999.99"
                step="0.01"
                required
                defaultValue={p?.consultation_fee ?? ""}
              />
            </div>
            <p className="fine-print">
              The platform stores a fee amount without a currency. Include the
              currency and consultation arrangements in your bio. No payments
              are processed.
            </p>
            <Submit busy={busy}>Save profile</Submit>
          </form>
        </section>
      </ResourceState>
    </Workspace>
  );
}
