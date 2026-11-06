import { useSearchParams } from "react-router-dom";
import { advisorsApi } from "../api/advisors.api";
import { useResource } from "../hooks/useResource";
import { Empty, PageHeader, ResourceState } from "../components/common/UI";
import Search from "../components/common/Search";
import AdvisorCard from "../components/advisors/AdvisorCard";
export default function Advisors() {
  const [params] = useSearchParams();
  const search = params.get("search") || "";
  const domain = params.get("domain") || "";
  const resource = useResource(
    () => advisorsApi.list({ search, domain }),
    [search, domain],
  );
  return (
    <div className="container section">
      <PageHeader
        label="The professional perspective"
        title="Find your next conversation."
      >
        Explore financial advisors. Find experience that speaks to your
        questions.
      </PageHeader>
      <Search placeholder="Search by name or specialization" />
      <ResourceState resource={resource}>
        {resource.data && (
          <>
            <p className="result-count">
              {resource.data.advisors.length} advisors
              {search && ` matching “${search}”`}
            </p>
            {resource.data.advisors.length ? (
              <div className="advisor-grid">
                {resource.data.advisors.map((a) => (
                  <AdvisorCard key={a.id} advisor={a} />
                ))}
              </div>
            ) : (
              <Empty title="The right conversation is still ahead.">
                No advisors match this search. Try another name or
                specialization, or check back as professionals join.
              </Empty>
            )}
          </>
        )}
      </ResourceState>
      <p className="fine-print">
        Profiles are provided by advisors themselves. Consultation fees are
        shown as listed; confirm the currency and arrangements directly with
        your advisor. Consultify does not process payments.
      </p>
    </div>
  );
}
