import { Link } from "react-router-dom";
import { Icon, Mark } from "../components/common/UI";
export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="tiny-line" />A clearer financial perspective
            </p>
            <h1>
              Good questions.
              <br />
              Better conversations.
              <br />
              <span>Brighter possibilities.</span>
            </h1>
            <p className="hero-description">
              Money decisions deserve a little perspective. Connect with
              financial advisors and a community that makes room for your
              questions.
            </p>
            <div className="actions">
              <Link className="button" to="/advisors">
                Find your advisor
                <Icon />
              </Link>
              <Link className="quiet-link" to="/community">
                Explore the community
                <Icon />
              </Link>
            </div>
            <div className="hero-footnote">
              <span>01 / FINANCE</span>
              <span>Built around your next step.</span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-top">
              <span>
                THE VALUE OF
                <br />A NEW PERSPECTIVE.
              </span>
              <Mark />
            </div>
            <div className="arch arch-one" />
            <div className="arch arch-two" />
            <div className="arch arch-three" />
            <div className="art-bottom">
              <span>
                LESS UNCERTAINTY.
                <br />
                MORE UNDERSTANDING.
              </span>
              <span className="art-arrow">↗</span>
            </div>
          </div>
        </div>
      </section>
      <div className="principles-strip">
        <div className="container">
          <span>Personal conversations</span>
          <i />
          <span>Financial perspectives</span>
          <i />
          <span>Shared understanding</span>
        </div>
      </div>
      <section className="section container introduction">
        <p className="eyebrow">A considered approach</p>
        <div>
          <h2>
            You don’t need all the answers.
            <br />
            Just a place to start.
          </h2>
          <p className="lede">
            Whether you’re thinking about saving, investing, or planning ahead,
            Consultify brings people and perspectives together. Find an advisor
            whose experience speaks to your needs, or start with a conversation
            in the community.
          </p>
        </div>
      </section>
      <section className="container process-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">From questions to conversations</p>
            <h2>Your next step, made simple.</h2>
          </div>
          <Link className="text-link" to="/advisors">
            Meet the advisors
            <Icon />
          </Link>
        </div>
        <div className="process-grid">
          {[
            [
              "01",
              "Find your perspective",
              "Explore financial advisors by name or specialization. Read their profiles, experience, and public reviews.",
              "people",
            ],
            [
              "02",
              "Make a connection",
              "Choose a local date and time, share what’s on your mind, and send your consultation request.",
              "calendar",
            ],
            [
              "03",
              "Keep the conversation going",
              "Track your request, then share a review after your advisor marks your consultation complete.",
              "message",
            ],
          ].map(([n, title, text, icon]) => (
            <article className="process" key={n}>
              <div className="process-top">
                <span>{n}</span>
                <Icon name={icon} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="container community-feature">
        <div className="community-art" aria-hidden="true">
          <span>
            GOOD QUESTIONS
            <br />
            BRING US TOGETHER.
          </span>
          <div className="conversation-circle circle-one" />
          <div className="conversation-circle circle-two" />
          <div className="conversation-circle circle-three" />
          <Mark />
        </div>
        <div className="community-copy">
          <p className="eyebrow">The Consultify community</p>
          <h2>
            A little shared knowledge.
            <br />A wider perspective.
          </h2>
          <p>
            Some questions are better explored together. Read financial
            discussions, contribute your experience, and recognize the ideas you
            find helpful.
          </p>
          <Link className="button secondary" to="/community">
            Join the conversation
            <Icon />
          </Link>
          <small>
            Community contributions are individual perspectives, not a
            substitute for personal professional advice.
          </small>
        </div>
      </section>
      <section className="advisor-invite">
        <div className="container">
          <div>
            <p className="eyebrow">For financial professionals</p>
            <h2>
              Bring your experience.
              <br />
              Make a meaningful connection.
            </h2>
          </div>
          <Link to="/register/advisor" className="button">
            Join as an advisor
            <Icon />
          </Link>
        </div>
      </section>
    </>
  );
}
