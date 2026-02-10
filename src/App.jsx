import { useEffect, useMemo, useRef, useState } from "react";
import { HashRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Art from "./pages/Art.jsx";
import YouTube from "./pages/YouTube.jsx";
import { rawEntries } from "./content/index.js";
import pdfLibrary from "./content/pdfs.json";
import { SACRED_AUDIO, SACRED_IMAGES } from "./content/sacred.js";

const CATEGORY_LABELS = {
  religious: "Religious",
  art: "Art",
  mathematics: "Mathematics",
  talk: "Let's Talk",
};

const TYPE_LABELS = {
  article: "Article",
  media: "Media",
};

const PDF_CATEGORIES = [
  { id: "religious", label: "Religious" },
  { id: "art", label: "Art" },
  { id: "mathematics", label: "Mathematics" },
  { id: "talk", label: "Let's Talk" },
];

function parseFrontmatter(raw) {
  if (!raw.startsWith("---")) {
    return { meta: {}, body: raw.trim() };
  }

  const [, frontmatter, ...rest] = raw.split("---");
  const meta = {};

  frontmatter
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [key, ...valueParts] = line.split(":");
      if (!key) return;
      const value = valueParts.join(":").trim();
      meta[key.trim().toLowerCase()] = value;
    });

  return {
    meta,
    body: rest.join("---").trim(),
  };
}

function normalizeEntry(raw, index) {
  const { meta, body } = parseFrontmatter(raw);
  const tags = String(meta.tags || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return {
    id: meta.id || `entry-${index}`,
    title: meta.title || "Untitled",
    date: meta.date || "",
    category: meta.category || "talk",
    type: meta.type || "article",
    summary: meta.summary || "",
    tags,
    hero: meta.hero || "",
    body,
  };
}

function AppShell() {
  const entries = useMemo(
    () => rawEntries.map(normalizeEntry).sort((a, b) => (a.date < b.date ? 1 : -1)),
    []
  );

  const [trackId, setTrackId] = useState(SACRED_AUDIO[0]?.id ?? "");
  const [isLooping, setIsLooping] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const activeTrack = SACRED_AUDIO.find((track) => track.id === trackId) || SACRED_AUDIO[0];

  async function play() {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
    } catch (_error) {
      // Browser autoplay policy requires a direct user interaction.
    }
  }

  function pause() {
    audioRef.current?.pause();
  }

  function togglePlayback() {
    if (isPlaying) {
      pause();
      return;
    }
    play();
  }

  useEffect(() => {
    if (isPlaying) play();
  }, [trackId]);

  return (
    <div className="app">
      <div className="orb orb-one" />
      <div className="orb orb-two" />

      <header className="site-nav">
        <div className="brand">
          <span className="brand-mark">LD</span>
          <div>
            <p className="eyebrow">Last Day Studio</p>
            <p className="brand-sub">Daily practice, study, and work</p>
          </div>
        </div>

        <nav className="nav-links" aria-label="Primary">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/art">Art Hall</NavLink>
          <NavLink to="/youtube">YouTube</NavLink>
        </nav>
      </header>

      <main className="app-grid">
        <Routes>
          <Route
            path="/"
            element={
              <Home
                entries={entries}
                categoryLabels={CATEGORY_LABELS}
                typeLabels={TYPE_LABELS}
                pdfCategories={PDF_CATEGORIES}
                pdfLibrary={pdfLibrary}
                sacredImages={SACRED_IMAGES}
                sacredAudio={SACRED_AUDIO}
                trackId={trackId}
                setTrackId={setTrackId}
                isLooping={isLooping}
                setIsLooping={setIsLooping}
                isPlaying={isPlaying}
                onTogglePlayback={togglePlayback}
              />
            }
          />
          <Route path="/art" element={<Art entries={entries} pdfLibrary={pdfLibrary} />} />
          <Route path="/youtube" element={<YouTube />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <aside className="mini-player" aria-label="Now playing">
        <div className={`waveform mini ${isPlaying ? "active" : ""}`}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <span key={idx} />
          ))}
        </div>

        <div className="mini-track">
          <p className="filter-label">Now playing</p>
          <p>{activeTrack?.composer}</p>
          <p className="muted">{activeTrack?.title}</p>
        </div>

        <div className="mini-controls">
          <button className="pill" type="button" onClick={togglePlayback}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          <select value={trackId} onChange={(event) => setTrackId(event.target.value)}>
            {SACRED_AUDIO.map((track) => (
              <option key={track.id} value={track.id}>
                {track.composer} - {track.title}
              </option>
            ))}
          </select>
        </div>
      </aside>

      <audio
        ref={audioRef}
        className="audio-element"
        src={activeTrack?.src}
        loop={isLooping}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}
