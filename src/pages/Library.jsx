import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import FullAccessAssistant from "../components/FullAccessAssistant.jsx";
import { formatDate } from "../lib/date.js";
import { renderMarkdown } from "../lib/content-utils.js";

export default function Library({
  entries,
  categoryLabels,
  typeLabels,
  pdfCategories,
  pdfLibrary,
  canAccessArticles,
  articlesError,
  onRequestSignIn,
}) {
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(entries[0]?.id ?? null);

  useEffect(() => {
    if (location.state?.activeId) {
      setActiveId(location.state.activeId);
    }
  }, [location.state]);

  useEffect(() => {
    if (!entries.length) {
      setActiveId(null);
      return;
    }

    if (!entries.some((entry) => entry.id === activeId)) {
      setActiveId(entries[0]?.id ?? null);
    }
  }, [entries, activeId]);

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

  if (!canAccessArticles) {
    return (
      <>
        <section className="hero">
          <p className="eyebrow">Library</p>
          <h1>Article reader and PDF archive.</h1>
          <p className="lead">This section is reserved for full-access members.</p>
        </section>

        <section className="locked-zone">
          <p className="eyebrow">Protected Article Library</p>
          <h2>Full access required for articles and PDF archives.</h2>
          <p>
            Visitor accounts can access member pages and School. Full accounts unlock article
            reading, PDF archives, and the site guide assistant.
          </p>
          {articlesError ? <p className="auth-error">{articlesError}</p> : null}
          <button type="button" className="pill" onClick={onRequestSignIn}>
            Sign in for full access
          </button>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="hero">
        <p className="eyebrow">Library</p>
        <h1>Full-access reading and archive workspace.</h1>
        <p className="lead">
          Filter articles by category/type, open details, browse PDF collections, and use the site guide assistant.
        </p>
      </section>

      <FullAccessAssistant />

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
  );
}
