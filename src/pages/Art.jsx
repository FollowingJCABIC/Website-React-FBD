import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function Art({ entries, pdfLibrary }) {
  const navigate = useNavigate();
  const artEntries = useMemo(() => entries.filter((entry) => entry.category === "art"), [entries]);
  const files = pdfLibrary.art || [];

  return (
    <>
      <section className="hero art-hero">
        <p className="eyebrow">Art Hall</p>
        <h1>A gallery for drafts, process, and final pieces.</h1>
        <p className="lead">
          Art notes, references, and supporting PDFs are grouped here for a cleaner publishing flow.
        </p>
      </section>

      <section className="art-hall">
        <div className="art-intro">
          <p className="eyebrow">Art Entries</p>
          <h2>Notes, media, and drafts.</h2>
        </div>

        <div className="art-grid">
          {artEntries.map((entry) => (
            <article key={entry.id} className="art-card">
              <div className="art-panel">{entry.hero || "New work"}</div>
              <div>
                <h3>{entry.title}</h3>
                <p>{entry.summary}</p>
                <button
                  className="pill"
                  type="button"
                  onClick={() => navigate("/", { state: { activeId: entry.id } })}
                >
                  Open entry on Home
                </button>
              </div>
            </article>
          ))}

          {artEntries.length === 0 && <p className="muted">No art entries yet.</p>}
        </div>
      </section>

      <section className="art-media">
        <div className="art-intro">
          <p className="eyebrow">Art Media</p>
          <h2>Permanent image workflow.</h2>
          <p>
            Put images into <code>public/art/</code> and list them in a future JSON index. This keeps
            deployment deterministic for GitHub Pages.
          </p>
        </div>
      </section>

      <section className="pdf-library">
        <div className="pdf-intro">
          <p className="eyebrow">Art PDFs</p>
          <h2>Catalog statements, plans, and notes.</h2>
        </div>

        <div className="pdf-grid">
          <div className="pdf-card">
            <div className="pdf-header">
              <h3>Art PDFs</h3>
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
        </div>
      </section>
    </>
  );
}
