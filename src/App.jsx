import { useEffect, useRef, useState } from "react";
import { HashRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Activities from "./pages/Activities.jsx";
import Reflections from "./pages/Reflections.jsx";
import Library from "./pages/Library.jsx";
import Art from "./pages/Art.jsx";
import YouTube from "./pages/YouTube.jsx";
import School from "./pages/School.jsx";
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

const ROLE_NONE = "none";
const ROLE_VISITOR = "visitor";
const ROLE_FULL = "full";
const DEFAULT_PDF_LIBRARY = {
  religious: [],
  art: [],
  mathematics: [],
  talk: [],
};

function AppShell() {
  const [entries, setEntries] = useState([]);
  const [meditations, setMeditations] = useState([]);
  const [pdfLibrary, setPdfLibrary] = useState(DEFAULT_PDF_LIBRARY);
  const [articlesError, setArticlesError] = useState("");

  const [authRole, setAuthRole] = useState(ROLE_NONE);
  const [authLoading, setAuthLoading] = useState(true);
  const [authPanelOpen, setAuthPanelOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [trackId, setTrackId] = useState(SACRED_AUDIO[0]?.id ?? "");
  const [isLooping, setIsLooping] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const canUseApps = authRole === ROLE_VISITOR || authRole === ROLE_FULL;
  const canUseMemberPages = canUseApps;
  const canAccessArticles = authRole === ROLE_FULL;

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
    let cancelled = false;

    async function boot() {
      try {
        const [sessionRes, meditationsRes] = await Promise.all([
          fetch("/api/auth/session", { credentials: "include" }),
          fetch("/api/meditations"),
        ]);

        if (!cancelled) {
          if (sessionRes.ok) {
            const session = await sessionRes.json();
            setAuthRole(session?.role || ROLE_NONE);
          } else {
            setAuthRole(ROLE_NONE);
          }

          if (meditationsRes.ok) {
            const meditationsPayload = await meditationsRes.json();
            setMeditations(Array.isArray(meditationsPayload?.entries) ? meditationsPayload.entries : []);
          } else {
            setMeditations([]);
          }
        }
      } catch (_error) {
        if (!cancelled) {
          setAuthRole(ROLE_NONE);
          setMeditations([]);
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    }

    boot();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!canAccessArticles) {
      setEntries([]);
      setPdfLibrary(DEFAULT_PDF_LIBRARY);
      setArticlesError("");
      return;
    }

    let cancelled = false;

    async function loadArticles() {
      try {
        const [articlesRes, pdfRes] = await Promise.all([
          fetch("/api/articles", { credentials: "include" }),
          fetch("/api/pdfs", { credentials: "include" }),
        ]);

        const payload = await articlesRes.json().catch(() => ({}));
        const pdfPayload = await pdfRes.json().catch(() => ({}));

        if (cancelled) return;

        if (!articlesRes.ok) {
          setEntries([]);
          setPdfLibrary(DEFAULT_PDF_LIBRARY);
          setArticlesError(payload?.error || "Could not load articles.");
          return;
        }

        setEntries(Array.isArray(payload?.entries) ? payload.entries : []);
        setPdfLibrary(
          pdfRes.ok && pdfPayload?.pdfLibrary && typeof pdfPayload.pdfLibrary === "object"
            ? pdfPayload.pdfLibrary
            : DEFAULT_PDF_LIBRARY
        );
        setArticlesError("");
      } catch (_error) {
        if (cancelled) return;
        setEntries([]);
        setPdfLibrary(DEFAULT_PDF_LIBRARY);
        setArticlesError("Could not load articles.");
      }
    }

    loadArticles();

    return () => {
      cancelled = true;
    };
  }, [canAccessArticles]);

  async function onAuthSubmit(event) {
    event.preventDefault();
    setAuthError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: authEmail.trim().toLowerCase(),
          password: authPassword,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setAuthError(payload?.error || "Sign in failed.");
        return;
      }

      const nextRole = payload?.role === ROLE_FULL || payload?.role === ROLE_VISITOR ? payload.role : ROLE_NONE;
      setAuthRole(nextRole);
      setAuthPanelOpen(false);
      setAuthPassword("");
    } catch (_error) {
      setAuthError("Sign in failed.");
    }
  }

  async function signOut() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (_error) {
      // Best effort sign-out.
    }

    setAuthRole(ROLE_NONE);
    setAuthPanelOpen(false);
    setAuthEmail("");
    setAuthPassword("");
    setAuthError("");
    setEntries([]);
    setPdfLibrary(DEFAULT_PDF_LIBRARY);
    setArticlesError("");
  }

  function requireMemberAccess(event) {
    if (canUseMemberPages) return;
    event.preventDefault();
    setAuthError("Visitor or full login is required for this page.");
    setAuthPanelOpen(true);
  }

  function requireFullAccess(event) {
    if (canAccessArticles) return;
    event.preventDefault();
    setAuthError("Full login is required for Library.");
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
            to="/activities"
            onClick={requireMemberAccess}
            className={({ isActive }) => `${isActive ? "active" : ""} ${canUseMemberPages ? "" : "locked-nav"}`.trim()}
          >
            Activities
          </NavLink>
          <NavLink
            to="/reflections"
            onClick={requireMemberAccess}
            className={({ isActive }) => `${isActive ? "active" : ""} ${canUseMemberPages ? "" : "locked-nav"}`.trim()}
          >
            Reflections
          </NavLink>
          <NavLink
            to="/library"
            onClick={requireFullAccess}
            className={({ isActive }) => `${isActive ? "active" : ""} ${canAccessArticles ? "" : "locked-nav"}`.trim()}
          >
            Library
          </NavLink>
          <NavLink
            to="/art"
            onClick={requireMemberAccess}
            className={({ isActive }) => `${isActive ? "active" : ""} ${canUseMemberPages ? "" : "locked-nav"}`.trim()}
          >
            Art Hall
          </NavLink>
          <NavLink
            to="/youtube"
            onClick={requireMemberAccess}
            className={({ isActive }) => `${isActive ? "active" : ""} ${canUseMemberPages ? "" : "locked-nav"}`.trim()}
          >
            YouTube
          </NavLink>
          <NavLink
            to="/school"
            onClick={requireMemberAccess}
            className={({ isActive }) => `${isActive ? "active" : ""} ${canUseMemberPages ? "" : "locked-nav"}`.trim()}
          >
            School
          </NavLink>
        </nav>

        <div className="auth-bar">
          {authLoading ? <span className="auth-state">Checking session...</span> : null}

          {!authLoading && authRole === ROLE_NONE ? (
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
                  <p className="auth-hint">
                    Visitor unlocks app/member pages, including School. Full unlocks article library
                    and School management tools.
                  </p>
                  {authError ? <p className="auth-error">{authError}</p> : null}
                </form>
              ) : null}
            </>
          ) : null}

          {!authLoading && authRole !== ROLE_NONE ? (
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
          ) : null}
        </div>
      </header>

      <main className="app-grid">
        <Routes>
          <Route
            path="/"
            element={
              <Home
                authRole={authRole}
                canUseApps={canUseApps}
                canAccessArticles={canAccessArticles}
                onRequestSignIn={() => {
                  setAuthError("");
                  setAuthPanelOpen(true);
                }}
              />
            }
          />
          <Route
            path="/activities"
            element={canUseMemberPages ? (
              <Activities
                canUseApps={canUseApps}
                onRequestSignIn={() => {
                  setAuthError("");
                  setAuthPanelOpen(true);
                }}
              />
            ) : <Navigate to="/" replace />}
          />
          <Route
            path="/reflections"
            element={canUseMemberPages ? (
              <Reflections
                entries={entries}
                meditations={meditations}
                sacredImages={SACRED_IMAGES}
                sacredAudio={SACRED_AUDIO}
                trackId={trackId}
                setTrackId={setTrackId}
                isLooping={isLooping}
                setIsLooping={setIsLooping}
                isPlaying={isPlaying}
                onTogglePlayback={togglePlayback}
                canAccessArticles={canAccessArticles}
              />
            ) : <Navigate to="/" replace />}
          />
          <Route
            path="/library"
            element={
              <Library
                entries={entries}
                categoryLabels={CATEGORY_LABELS}
                typeLabels={TYPE_LABELS}
                pdfCategories={PDF_CATEGORIES}
                pdfLibrary={pdfLibrary}
                canAccessArticles={canAccessArticles}
                articlesError={articlesError}
                onRequestSignIn={() => {
                  setAuthError("");
                  setAuthPanelOpen(true);
                }}
              />
            }
          />
          <Route
            path="/art"
            element={canUseMemberPages ? <Art entries={entries} pdfLibrary={pdfLibrary} canAccessArticles={canAccessArticles} /> : <Navigate to="/" replace />}
          />
          <Route path="/youtube" element={canUseMemberPages ? <YouTube /> : <Navigate to="/" replace />} />
          <Route path="/school" element={canUseMemberPages ? <School authRole={authRole} /> : <Navigate to="/" replace />} />
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
