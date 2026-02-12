import { useMemo } from "react";
import { Link } from "react-router-dom";
import { MASTERWORKS } from "../content/masterworks.js";

function QuickCard({ title, description, to, href, cta, locked, onRequestSignIn }) {
  const isExternal = Boolean(href);

  return (
    <article className="home-quick-card">
      <h3>{title}</h3>
      <p>{description}</p>
      {locked ? (
        <button className="pill" type="button" onClick={onRequestSignIn}>
          Sign in to unlock
        </button>
      ) : isExternal ? (
        <a className="pill" href={href} target="_blank" rel="noreferrer">
          {cta}
        </a>
      ) : (
        <Link className="pill" to={to}>
          {cta}
        </Link>
      )}
    </article>
  );
}

export default function Home({ authRole, canUseApps, canAccessArticles, onRequestSignIn }) {
  const roleLabel = authRole === "full" ? "Full access" : authRole === "visitor" ? "Visitor access" : "Public";
  const isPublic = authRole === "none";
  const dailyMasterworks = useMemo(() => {
    const list = Array.isArray(MASTERWORKS) ? MASTERWORKS : [];
    if (!list.length) return [];

    const now = new Date();
    const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const daySeed = Math.floor(localMidnight / 86_400_000);
    return Array.from({ length: Math.min(3, list.length) }, (_, idx) => list[(daySeed + idx) % list.length]);
  }, []);

  return (
    <div className="home-shell">
      <aside className="daily-masterworks" aria-label="Daily rotating masterworks">
        <p className="eyebrow">Daily Masterworks</p>
        <h2>Clean & Biblical Art Rotation</h2>
        <p className="muted">
          Curated famous works rotate each day, including Caravaggio, Degas, and Leonardo da Vinci.
        </p>

        <div className="masterworks-list">
          {dailyMasterworks.map((work, idx) => (
            <article key={work.id} className={`masterwork-card ${idx === 0 ? "is-featured" : ""}`}>
              <a href={work.creditUrl} target="_blank" rel="noreferrer" aria-label={`Open source for ${work.title}`}>
                <img src={work.src} alt={`${work.title} by ${work.artist}`} loading="lazy" />
              </a>
              <div className="masterwork-meta">
                <p className="chip">{idx === 0 ? "Today" : idx === 1 ? "Next" : "Then"}</p>
                <h3>{work.title}</h3>
                <p>{work.artist} · {work.era}</p>
                <p className="muted">Theme: {work.theme}</p>
              </div>
            </article>
          ))}
        </div>
      </aside>

      <div className="home-main">
        <section className="hero">
          <p className="eyebrow">Last Day Studio</p>
          <h1>Study, create, and teach from one clean workspace.</h1>
          <p className="lead">
            Landing is now intentionally simple. Bible Mastery Lab stays free from here, while other sections
            require sign-in.
          </p>
          <p className="lead about">Current access: {roleLabel}</p>
        </section>

        <section className="home-quick-links">
          <div className="home-quick-intro">
            <p className="eyebrow">Workspace Routes</p>
            <h2>Pick where you want to work</h2>
          </div>

          <div className="home-quick-grid">
            <QuickCard
              title="Bible Mastery Lab"
              description="Free scripture drills, motif testing, alphabet practice, and scripture lookup."
              href="/apps/bible/index.html"
              cta="Open Bible Mastery Lab"
              locked={false}
              onRequestSignIn={onRequestSignIn}
            />

            {!isPublic ? (
              <>
                <QuickCard
                  title="Activities"
                  description="Open interactive external tools and standalone apps."
                  to="/activities"
                  cta="Open Activities"
                  locked={!canUseApps}
                  onRequestSignIn={onRequestSignIn}
                />

                <QuickCard
                  title="Reflections"
                  description="Sacred media, daily liturgy, and journal thoughts."
                  to="/reflections"
                  cta="Open Reflections"
                  locked={!canUseApps}
                  onRequestSignIn={onRequestSignIn}
                />

                <QuickCard
                  title="Library"
                  description="Article reader, PDF archive, and full-access site assistant."
                  to="/library"
                  cta="Open Library"
                  locked={!canAccessArticles}
                  onRequestSignIn={onRequestSignIn}
                />

                <QuickCard
                  title="Art Hall"
                  description="Art entries, drafts, and media-focused pages."
                  to="/art"
                  cta="Open Art Hall"
                  locked={!canUseApps}
                  onRequestSignIn={onRequestSignIn}
                />

                <QuickCard
                  title="YouTube"
                  description="Video publishing index and embeds from your list."
                  to="/youtube"
                  cta="Open YouTube"
                  locked={!canUseApps}
                  onRequestSignIn={onRequestSignIn}
                />

                <QuickCard
                  title="School"
                  description="Classroom tools, whiteboard, assignments, and meeting panel."
                  to="/school"
                  cta="Open School"
                  locked={!canUseApps}
                  onRequestSignIn={onRequestSignIn}
                />
              </>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
