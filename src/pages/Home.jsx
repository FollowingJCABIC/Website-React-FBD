import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { formatDate } from "../lib/date.js";
import { renderMarkdown } from "../lib/content-utils.js";

const THOUGHTS_KEY = "daily-thoughts-v1";

function AppLinkAction({ canUseApps, href, children, onRequestSignIn }) {
  if (canUseApps) {
    return (
      <a className="pill" href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }

  return (
    <button type="button" className="pill locked-pill" onClick={onRequestSignIn}>
      Sign in to open
    </button>
  );
}

export default function Home({
  entries,
  meditations,
  categoryLabels,
  typeLabels,
  pdfCategories,
  pdfLibrary,
  sacredImages,
  sacredAudio,
  trackId,
  setTrackId,
  isLooping,
  setIsLooping,
  isPlaying,
  onTogglePlayback,
  canUseApps,
  canAccessArticles,
  articlesError,
  onRequestSignIn,
}) {
  const location = useLocation();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(entries[0]?.id ?? null);

  const [thoughts, setThoughts] = useState([]);
  const [thoughtDate, setThoughtDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [thoughtText, setThoughtText] = useState("");

  useEffect(() => {
    if (location.state?.activeId) {
      setActiveId(location.state.activeId);
    }
  }, [location.state]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(THOUGHTS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setThoughts(parsed);
      }
    } catch (_error) {
      setThoughts([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(THOUGHTS_KEY, JSON.stringify(thoughts));
  }, [thoughts]);

  const filteredEntries = entries.filter((entry) => {
    const categoryMatch = selectedCategory === "all" || entry.category === selectedCategory;
    const typeMatch = selectedType === "all" || entry.type === selectedType;
    const searchMatch =
      !search ||
      [entry.title, entry.summary, entry.tags.join(" "), entry.body]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

    return categoryMatch && typeMatch && searchMatch;
  });

  const activeEntry = entries.find((entry) => entry.id === activeId) || filteredEntries[0] || null;
  const religiousEntries = useMemo(
    () => entries.filter((entry) => entry.category === "religious"),
    [entries]
  );
  const liturgyEntries = canAccessArticles ? religiousEntries : meditations;

  const activeTrack = sacredAudio.find((track) => track.id === trackId) || sacredAudio[0];

  function downloadFile(filename, content) {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function exportThoughts() {
    if (!thoughts.length) return;
    const stamp = new Date().toISOString().slice(0, 10);
    const content = [
      `# Daily Thoughts Export (${stamp})`,
      "",
      ...thoughts.map((thought) => `## ${formatDate(thought.date)}\n${thought.text}\n`),
    ].join("\n");

    downloadFile(`daily-thoughts-${stamp}.md`, content);
  }

  function promoteThought(thought) {
    const stamp = thought.date.replaceAll("-", "");
    const suffix = String(thought.id).slice(-4);
    const entryId = `thought-${stamp}-${suffix}`;
    const title = thought.text.split(" ").slice(0, 7).join(" ") || "Daily Thought";

    const markdown = [
      "---",
      `id: ${entryId}`,
      `title: ${title}`,
      `date: ${thought.date}`,
      "category: religious",
      "type: article",
      "summary: Daily thought promoted to a full entry.",
      "tags: daily, reflection",
      "hero: Daily thought",
      "---",
      "",
      "# Reflection",
      thought.text,
      "",
    ].join("\n");

    downloadFile(`${entryId}.md`, markdown);
  }

  function saveThought() {
    if (!thoughtText.trim()) return;

    setThoughts((current) => [
      {
        id: `${thoughtDate}-${Date.now()}`,
        date: thoughtDate,
        text: thoughtText.trim(),
      },
      ...current,
    ]);

    setThoughtText("");
  }

  return (
    <>
      <section className="trinity-banner" aria-label="Hebrew Trinity banner">
        <p className="trinity-hebrew" lang="he" dir="rtl">
          האב • הבן • רוח הקודש
        </p>
      </section>

      <section className="hero">
        <p className="eyebrow">Last Day Studio</p>
        <h1>Religious reflections, art drafts, math notes, and open talk.</h1>
        <p className="lead">
          A quiet place to share the work of the day. Browse by category, switch between
          articles and media, and let sacred images and music keep the room warm.
        </p>
        <p className="lead about">
          Jose G. Chavez - mathematician and polymath - shares daily work, creative process, and a
          newfound faith. Like anyone, he struggles, and these pages hold a desperate search for
          Jesus Christ, told in prayer, proof, and practice.
        </p>
      </section>

      <section className="external-apps">
        <div className="apps-intro">
          <p className="eyebrow">More Activities</p>
          <h2>Other Activities & Applications</h2>
          <p>Visit these standalone apps for more interactive practice and creative work.</p>
          {!canUseApps ? <p className="lock-note">Visitor or full sign-in is required to open app links.</p> : null}
        </div>

        <div className="apps-grid">
          <article className="app-link-card">
            <h3>Dictionary Thesaurus Translator</h3>
            <p>Search definitions, synonyms, and quick translations in one focused workspace.</p>
            <AppLinkAction
              canUseApps={canUseApps}
              href="https://dictionary-thesaurus-translator.vercel.app"
              onRequestSignIn={onRequestSignIn}
            >
              Open dictionary-thesaurus-translator.vercel.app
            </AppLinkAction>
          </article>

          <article className="app-link-card">
            <h3>Language Studio</h3>
            <p>Interactive language lessons and practice tools for daily study sessions.</p>
            <AppLinkAction
              canUseApps={canUseApps}
              href="https://language-studio-five.vercel.app"
              onRequestSignIn={onRequestSignIn}
            >
              Open language-studio-five.vercel.app
            </AppLinkAction>
          </article>

          <article className="app-link-card">
            <h3>Color Mixing App</h3>
            <p>Hands-on additive and subtractive color labs, with guided visual activities.</p>
            <AppLinkAction
              canUseApps={canUseApps}
              href="https://color-mixing-app.vercel.app"
              onRequestSignIn={onRequestSignIn}
            >
              Open color-mixing-app.vercel.app
            </AppLinkAction>
          </article>

          <article className="app-link-card">
            <h3>Songwriter App</h3>
            <p>Songwriting prompts, drafting workspace, and music-theory tools for practice.</p>
            <AppLinkAction
              canUseApps={canUseApps}
              href="https://songwriter-app.vercel.app"
              onRequestSignIn={onRequestSignIn}
            >
              Open songwriter-app.vercel.app
            </AppLinkAction>
          </article>

          <article className="app-link-card">
            <h3>Crossword Creator</h3>
            <p>Generate custom crosswords from your own word lists and export results.</p>
            <AppLinkAction
              canUseApps={canUseApps}
              href="https://crossword-creator-app.vercel.app"
              onRequestSignIn={onRequestSignIn}
            >
              Open crossword-creator-app.vercel.app
            </AppLinkAction>
          </article>

          <article className="app-link-card">
            <h3>Texas Hold'em Web</h3>
            <p>Play the browser version of your Texas Hold'em project and test game flow.</p>
            <AppLinkAction
              canUseApps={canUseApps}
              href="https://texas-holdem-lan-web.vercel.app"
              onRequestSignIn={onRequestSignIn}
            >
              Open texas-holdem-lan-web.vercel.app
            </AppLinkAction>
          </article>

          <article className="app-link-card">
            <h3>Sudoku Studio</h3>
            <p>Play seeded Sudoku with notes, hints, strategy guides, and custom themes.</p>
            <AppLinkAction canUseApps={canUseApps} href="/apps/sudoku/index.html" onRequestSignIn={onRequestSignIn}>
              Open Sudoku Studio
            </AppLinkAction>
          </article>
        </div>
      </section>

      <section className="sacred">
        <div className="sacred-text">
          <p className="eyebrow">Sacred Media</p>
          <h2>Famous works and a listening corner.</h2>
          <p>A small loop of Bach and Beethoven paired with sacred art.</p>

          <div className="audio-panel">
            <label htmlFor="track" className="filter-label">
              Music selection
            </label>

            <div className="audio-controls">
              <select id="track" value={trackId} onChange={(event) => setTrackId(event.target.value)}>
                {sacredAudio.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.composer} - {track.title}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className={`pill ${isLooping ? "active" : ""}`}
                onClick={() => setIsLooping((prev) => !prev)}
              >
                {isLooping ? "Repeat on" : "Repeat off"}
              </button>

              <button type="button" className="pill" onClick={onTogglePlayback}>
                {isPlaying ? "Pause" : "Play"}
              </button>
            </div>

            <div className="now-playing">
              <div className={`waveform ${isPlaying ? "active" : ""}`}>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <span key={idx} />
                ))}
              </div>
              <div>
                <p className="filter-label">Now playing</p>
                <p className="track">
                  {activeTrack?.composer} - {activeTrack?.title}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="sacred-gallery">
          {sacredImages.map((image) => (
            <figure key={image.id} className="sacred-card">
              <img src={image.src} alt={`${image.title} by ${image.artist}`} loading="lazy" />
              <figcaption>
                <span>{image.title}</span>
                <span className="muted">{image.artist}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="liturgy">
        <div className="liturgy-intro">
          <p className="eyebrow">Daily Liturgy</p>
          <h2>Religious entries grouped for slow reading.</h2>
        </div>

        <div className="liturgy-grid">
          {liturgyEntries.map((entry) => (
            <button key={entry.id} className="liturgy-card" onClick={() => setActiveId(entry.id)}>
              <span className="chip">{formatDate(entry.date)}</span>
              <h3>{entry.title}</h3>
              <p>{entry.summary}</p>
              <span className="liturgy-hero">{entry.hero || "Quiet note"}</span>
            </button>
          ))}
          {liturgyEntries.length === 0 ? <p className="muted">No meditations available yet.</p> : null}
        </div>
      </section>

      <section className="daily-thoughts">
        <div className="thoughts-intro">
          <p className="eyebrow">Daily Thoughts</p>
          <h2>Quick reflections you can save in seconds.</h2>
          <p>
            Thoughts are stored in this browser. Export all thoughts or promote any thought into a
            full markdown entry file.
          </p>
        </div>

        <div className="thoughts-form">
          <label className="filter-label" htmlFor="thought-date">
            Date
          </label>
          <input
            id="thought-date"
            type="date"
            value={thoughtDate}
            onChange={(event) => setThoughtDate(event.target.value)}
          />

          <label className="filter-label" htmlFor="thought-text">
            Reflection
          </label>
          <textarea
            id="thought-text"
            rows={4}
            placeholder="What landed today?"
            value={thoughtText}
            onChange={(event) => setThoughtText(event.target.value)}
          />

          <div className="thought-actions">
            <button type="button" className="pill" onClick={saveThought}>
              Save thought
            </button>
            <button type="button" className="pill" onClick={exportThoughts}>
              Export all to Markdown
            </button>
          </div>
        </div>

        <div className="thoughts-list">
          {thoughts.length === 0 && <p className="muted">No daily thoughts yet.</p>}
          {thoughts.map((thought) => (
            <div key={thought.id} className="thought-card">
              <span className="chip">{formatDate(thought.date)}</span>
              <p>{thought.text}</p>
              <div className="thought-actions">
                <button className="pill" type="button" onClick={() => promoteThought(thought)}>
                  Promote to entry
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {canAccessArticles ? (
        <>
      <section className="filters">
        <div className="filter-group">
          <span className="filter-label">Category</span>
          <div className="pill-row">
            <button
              className={`pill ${selectedCategory === "all" ? "active" : ""}`}
              onClick={() => setSelectedCategory("all")}
            >
              All
            </button>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <button
                key={value}
                className={`pill ${selectedCategory === value ? "active" : ""}`}
                onClick={() => setSelectedCategory(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">Type</span>
          <div className="pill-row">
            <button
              className={`pill ${selectedType === "all" ? "active" : ""}`}
              onClick={() => setSelectedType("all")}
            >
              All
            </button>
            {Object.entries(typeLabels).map(([value, label]) => (
              <button
                key={value}
                className={`pill ${selectedType === value ? "active" : ""}`}
                onClick={() => setSelectedType(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">Search</span>
          <input
            className="search"
            value={search}
            placeholder="Find a note, a symbol, a prayer..."
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </section>

      <section className="grid">
        <div className="list">
          {filteredEntries.map((entry) => (
            <button
              key={entry.id}
              className={`card ${activeEntry?.id === entry.id ? "active" : ""}`}
              onClick={() => setActiveId(entry.id)}
            >
              <div className="card-header">
                <span className="chip">{categoryLabels[entry.category] || entry.category}</span>
                <span className="type">{typeLabels[entry.type] || entry.type}</span>
              </div>
              <h2>{entry.title}</h2>
              <p>{entry.summary}</p>
              <div className="card-footer">
                <span>{formatDate(entry.date)}</span>
                <span className="tags">{entry.tags.slice(0, 3).join(" · ")}</span>
              </div>
            </button>
          ))}

          {filteredEntries.length === 0 && <div className="empty">No notes match that search.</div>}
        </div>

        <article className="detail">
          {activeEntry ? (
            <>
              <div className="detail-hero">
                <div>
                  <p className="eyebrow">{categoryLabels[activeEntry.category]}</p>
                  <h2>{activeEntry.title}</h2>
                  <p className="detail-meta">
                    {typeLabels[activeEntry.type]} · {formatDate(activeEntry.date)}
                  </p>
                </div>
                <div className="detail-art">
                  <div className="frame">
                    <span>{activeEntry.hero || "Daily pulse"}</span>
                  </div>
                </div>
              </div>

              <div
                className="detail-body"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(activeEntry.body),
                }}
              />
            </>
          ) : (
            <div className="empty">Pick a note to read.</div>
          )}
        </article>
      </section>

      <section className="pdf-library">
        <div className="pdf-intro">
          <p className="eyebrow">PDF Library</p>
          <h2>Archive PDFs by category.</h2>
          <p>
            Put PDF files into <code>public/pdfs/&lt;category&gt;</code> and run
            <code> npm run update-content</code> before committing.
          </p>
        </div>

        <div className="pdf-grid">
          {pdfCategories.map((category) => {
            const files = pdfLibrary[category.id] || [];
            return (
              <div key={category.id} className="pdf-card">
                <div className="pdf-header">
                  <h3>{category.label}</h3>
                </div>
                <div className="pdf-list">
                  {files.length === 0 && <p className="muted">No PDFs yet. Add them to the library.</p>}
                  {files.map((file) => (
                    <a key={file.id} href={file.url} target="_blank" rel="noreferrer">
                      <span>{file.title}</span>
                      <span className="muted">{file.size || "PDF"}</span>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
        </>
      ) : (
        <section className="locked-zone">
          <p className="eyebrow">Protected Article Library</p>
          <h2>Full access required for articles and PDF archives.</h2>
          <p>
            Public users can view intro and daily meditations. Visitor accounts can access app
            links and member pages. Full accounts unlock article reading.
          </p>
          {articlesError ? <p className="auth-error">{articlesError}</p> : null}
          <button type="button" className="pill" onClick={onRequestSignIn}>
            Sign in for full article access
          </button>
        </section>
      )}

      <footer className="credits">
        <p className="filter-label">Credits</p>
        <p>Sacred artwork and recordings are sourced from Wikimedia Commons and Musopen.</p>
        <div className="credit-links">
          {sacredImages.map((image) => (
            <a key={image.id} href={image.creditUrl} target="_blank" rel="noreferrer">
              {image.title}
            </a>
          ))}
          {sacredAudio.map((track) => (
            <a key={track.id} href={track.creditUrl} target="_blank" rel="noreferrer">
              {track.composer} - {track.title}
            </a>
          ))}
        </div>
      </footer>
    </>
  );
}
