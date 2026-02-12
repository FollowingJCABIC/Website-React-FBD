import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../lib/date.js";

const THOUGHTS_KEY = "daily-thoughts-v1";

export default function Reflections({
  entries,
  meditations,
  sacredImages,
  sacredAudio,
  trackId,
  setTrackId,
  isLooping,
  setIsLooping,
  isPlaying,
  onTogglePlayback,
  canAccessArticles,
}) {
  const navigate = useNavigate();
  const [thoughts, setThoughts] = useState([]);
  const [thoughtDate, setThoughtDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [thoughtText, setThoughtText] = useState("");

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
      <section className="hero">
        <p className="eyebrow">Reflections</p>
        <h1>Sacred study, liturgy notes, and daily thought capture.</h1>
        <p className="lead">
          This page groups the reflective content into one workflow: listen, read, and journal.
        </p>
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
          <p className="muted">
            {canAccessArticles
              ? "Open any entry directly in the Library reader."
              : "Full login unlocks complete article reading in Library."}
          </p>
        </div>

        <div className="liturgy-grid">
          {liturgyEntries.map((entry) =>
            canAccessArticles ? (
              <button
                key={entry.id}
                className="liturgy-card"
                onClick={() => navigate("/library", { state: { activeId: entry.id } })}
              >
                <span className="chip">{formatDate(entry.date)}</span>
                <h3>{entry.title}</h3>
                <p>{entry.summary}</p>
                <span className="liturgy-hero">{entry.hero || "Quiet note"}</span>
              </button>
            ) : (
              <article key={entry.id} className="liturgy-card">
                <span className="chip">{formatDate(entry.date)}</span>
                <h3>{entry.title}</h3>
                <p>{entry.summary}</p>
                <span className="liturgy-hero">{entry.hero || "Quiet note"}</span>
              </article>
            )
          )}
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
    </>
  );
}
