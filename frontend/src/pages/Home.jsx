import { Link } from "react-router-dom";
export default function Home() {
  return (
    <>
      <section className="home-hero container">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="live-dot" /> A clearer way forward
          </span>
          <h1>
            Your money.
            <br />
            Your questions.
            <br />
            <em>A little more clarity.</em>
          </h1>
          <p>
            Connect with financial advisors and a community of curious minds.
            Make room for better conversations about your financial future.
          </p>
          <div className="actions">
            <Link className="button" to="/advisors">
              Find your advisor <span aria-hidden="true">↗</span>
            </Link>
            <Link className="text-link" to="/community">
              Explore the community <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="hero-note">
            <span className="line" /> Personal conversations. Shared
            perspectives.
          </div>
        </div>
        <div className="hero-art">
          <span className="art-caption">
            THE NEXT CHAPTER STARTS WITH A QUESTION.
          </span>
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <div className="clarity-card">
            <span className="eyebrow">Your financial journey</span>
            <h2>
              Find perspective.
              <br />
              Move forward.
            </h2>
            <div className="journey-line">
              <span>01</span>
              <div>
                <strong>Discover</strong>
                <p>Find an advisor for your questions.</p>
              </div>
            </div>
            <div className="journey-line">
              <span>02</span>
              <div>
                <strong>Connect</strong>
                <p>Request a consultation.</p>
              </div>
            </div>
            <div className="journey-line">
              <span>03</span>
              <div>
                <strong>Reflect</strong>
                <p>Share your experience with others.</p>
              </div>
            </div>
            <Link to="/advisors" className="card-bottom">
              Explore financial advisors <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <span className="art-foot">
            A conversation can change your perspective.
          </span>
        </div>
      </section>
      <section className="principles">
        <div className="container principles-grid">
          <div>
            <span className="eyebrow">Built for real questions</span>
            <h2>
              Two paths.
              <br />
              One thoughtful community.
            </h2>
          </div>
          <article>
            <span className="step">01 / PROFESSIONAL ADVICE</span>
            <h3>A conversation, focused on you.</h3>
            <p>
              Explore specializations, read reviews, and book a financial
              advisor. Track your request from pending to completed.
            </p>
            <Link to="/advisors" className="text-link">
              Meet the advisors →
            </Link>
          </article>
          <article>
            <span className="step">02 / COMMUNITY PERSPECTIVES</span>
            <h3>Learn from the questions we share.</h3>
            <p>
              Ask about saving, investing, or financial planning. Join
              discussions and recognize perspectives you find helpful.
            </p>
            <Link to="/community" className="text-link">
              Join a discussion →
            </Link>
          </article>
        </div>
      </section>
      <section className="container section">
        <div className="invitation">
          <div>
            <span className="eyebrow">For financial advisors</span>
            <h2>
              Bring your perspective
              <br />
              to the conversation.
            </h2>
            <p>
              Create your professional profile and manage consultation requests
              in one place.
            </p>
          </div>
          <Link to="/register/advisor" className="button secondary">
            Register as an advisor ↗
          </Link>
        </div>
        <p className="fineprint">
          Advisor registration is self-service. Profiles and community
          contributions are not independently verified.
        </p>
      </section>
    </>
  );
}
