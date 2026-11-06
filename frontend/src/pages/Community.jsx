import { Link, useSearchParams } from "react-router-dom";
import { communityApi } from "../api/community.api";
import { useResource } from "../hooks/useResource";
import {
  Empty,
  Icon,
  PageHeader,
  ResourceState,
} from "../components/common/UI";
import Search from "../components/common/Search";
import PostCard from "../components/community/PostCard";
export default function Community() {
  const [params] = useSearchParams();
  const search = params.get("search") || "";
  const domain = params.get("domain") || "";
  const resource = useResource(
    () => communityApi.list({ search, domain }),
    [search, domain],
  );
  return (
    <div className="container section">
      <PageHeader
        label="The shared perspective"
        title="Good questions bring us together."
        action={
          <Link className="button" to="/community/new">
            Start a discussion
            <Icon name="plus" />
          </Link>
        }
      >
        A space to ask, share, and see finance from a different point of view.
      </PageHeader>
      <div className="community-layout">
        <section>
          <Search placeholder="Search financial discussions" />
          <ResourceState resource={resource}>
            {resource.data && (
              <>
                <p className="result-count">
                  {resource.data.posts.length} discussions
                </p>
                {resource.data.posts.length ? (
                  <div className="stack">
                    {resource.data.posts.map((p) => (
                      <PostCard key={p.id} post={p} />
                    ))}
                  </div>
                ) : (
                  <Empty
                    title="Every conversation starts somewhere."
                    to="/community/new"
                    action="Start a discussion"
                  >
                    No discussions match this search. Try another question, or
                    start a new one.
                  </Empty>
                )}
              </>
            )}
          </ResourceState>
        </section>
        <aside className="community-aside">
          <p className="eyebrow">Room for perspective</p>
          <h2>Curiosity looks good on you.</h2>
          <p>
            Ask a thoughtful question. Share what you’ve learned. Be generous
            with understanding.
          </p>
          <hr />
          <h3>A considered conversation</h3>
          <p>
            Keep discussions respectful and relevant to finance. Avoid posting
            personal financial details or confidential information.
          </p>
          <small>
            Community posts express individual views and are not personalized
            financial advice.
          </small>
        </aside>
      </div>
    </div>
  );
}
