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

const AUTH_STORAGE_KEY = "last-day-studio-auth-v1";
const ROLE_NONE = "none";
const ROLE_VISITOR = "visitor";
const ROLE_FULL = "full";
const FALLBACK_VISITOR_EMAIL = "visitor@lastday.studio";
const FALLBACK_VISITOR_PASSWORD = "Visitor#2026";
const FALLBACK_FULL_EMAIL = "admin@lastday.studio";
const FALLBACK_FULL_PASSWORD = "LastDay#2026";

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

  const visitorEmail = String(import.meta.env.VITE_VISITOR_EMAIL || "").trim().toLowerCase() || FALLBACK_VISITOR_EMAIL;
  const visitorPassword = String(import.meta.env.VITE_VISITOR_PASSWORD || "") || FALLBACK_VISITOR_PASSWORD;
  const fullEmail = String(import.meta.env.VITE_FULL_EMAIL || "").trim().toLowerCase() || FALLBACK_FULL_EMAIL;
  const fullPassword = String(import.meta.env.VITE_FULL_PASSWORD || "") || FALLBACK_FULL_PASSWORD;

  const [authRole, setAuthRole] = useState(() => {
    if (typeof window === "undefined") return ROLE_NONE;
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return ROLE_NONE;
      const parsed = JSON.parse(raw);
      if (parsed?.role === ROLE_VISITOR || parsed?.role === ROLE_FULL) {
        return parsed.role;
      }
      return ROLE_NONE;
    } catch (_error) {
      return ROLE_NONE;
    }
  });
  const [authPanelOpen, setAuthPanelOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [trackId, setTrackId] = useState(SACRED_AUDIO[0]?.id ?? "");
  const [isLooping, setIsLooping] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const canUseApps = authRole === ROLE_VISITOR || authRole === ROLE_FULL;
  const canAccessPrivate = authRole === ROLE_FULL;

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (authRole === ROLE_NONE) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        role: authRole,
        signedAt: new Date().toISOString(),
      })
    );
  }, [authRole]);

  function onAuthSubmit(event) {
    event.preventDefault();
    const email = authEmail.trim().toLowerCase();
    const password = authPassword;
    if (email === fullEmail && password === fullPassword) {
      setAuthRole(ROLE_FULL);
      setAuthPanelOpen(false);
      setAuthError("");
      setAuthPassword("");
      return;
    }
    if (email === visitorEmail && password === visitorPassword) {
      setAuthRole(ROLE_VISITOR);
      setAuthPanelOpen(false);
      setAuthError("");
      setAuthPassword("");
      return;
    }
    setAuthError("Credentials did not match a visitor or full account.");
  }

  function signOut() {
    setAuthRole(ROLE_NONE);
    setAuthPanelOpen(false);
    setAuthEmail("");
    setAuthPassword("");
    setAuthError("");
  }

  function requireFullAccess(event) {
    if (canAccessPrivate) return;
    event.preventDefault();
    setAuthError("Full access login is required for this section.");
    setAuthPanelOpen(true);
  }

  return (
    <div className={`app ${authRole === ROLE_NONE ? "is-locked" : "is-authenticated"}`}>
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
          <NavLink
            to="/art"
            onClick={requireFullAccess}
            className={({ isActive }) => `${isActive ? "active" : ""} ${canAccessPrivate ? "" : "locked-nav"}`.trim()}
          >
            Art Hall
          </NavLink>
          <NavLink
            to="/youtube"
            onClick={requireFullAccess}
            className={({ isActive }) => `${isActive ? "active" : ""} ${canAccessPrivate ? "" : "locked-nav"}`.trim()}
          >
            YouTube
          </NavLink>
        </nav>

        <div className="auth-bar">
          {authRole === ROLE_NONE ? (
            <>
              <button className="pill auth-button" type="button" onClick={() => setAuthPanelOpen((prev) => !prev)}>
                Sign in
              </button>
              {authPanelOpen ? (
                <form className="auth-panel" onSubmit={onAuthSubmit}>
                  <p className="filter-label">Sign in (visitor or full)</p>
                  <input
                    type="email"
                    placeholder="email"
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="password"
                    value={authPassword}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    required
                  />
                  <button className="pill auth-submit" type="submit">
                    Unlock
                  </button>
                  <p className="auth-hint">Visitor unlocks app links. Full unlocks articles and library.</p>
                  {authError ? <p className="auth-error">{authError}</p> : null}
                </form>
              ) : null}
            </>
          ) : (
            <>
              <span className="auth-state">
                Signed in: {authRole === ROLE_FULL ? "Full access" : "Visitor access"}
              </span>
              {authRole === ROLE_VISITOR ? (
                <button className="pill auth-button" type="button" onClick={() => setAuthPanelOpen((prev) => !prev)}>
                  Upgrade to full
                </button>
              ) : null}
              <button className="pill auth-button" type="button" onClick={signOut}>
                Sign out
              </button>
              {authPanelOpen ? (
                <form className="auth-panel" onSubmit={onAuthSubmit}>
                  <p className="filter-label">Upgrade access</p>
                  <input
                    type="email"
                    placeholder="full-access email"
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="password"
                    value={authPassword}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    required
                  />
                  <button className="pill auth-submit" type="submit">
                    Upgrade
                  </button>
                  {authError ? <p className="auth-error">{authError}</p> : null}
                </form>
              ) : null}
            </>
          )}
        </div>
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
                canUseApps={canUseApps}
                canAccessPrivate={canAccessPrivate}
                onRequestSignIn={() => {
                  setAuthError("");
                  setAuthPanelOpen(true);
                }}
              />
            }
          />
          <Route
            path="/art"
            element={
              canAccessPrivate ? (
                <Art entries={entries} pdfLibrary={pdfLibrary} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="/youtube" element={canAccessPrivate ? <YouTube /> : <Navigate to="/" replace />} />
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
