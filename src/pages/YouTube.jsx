import { useEffect, useMemo, useState } from "react";

function extractVideoId(url) {
  try {
    const parsed = new URL(String(url || ""));
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }

    if (host.endsWith("youtube.com")) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (["shorts", "embed", "live"].includes(parts[0])) {
        return parts[1] || null;
      }
    }
  } catch (_error) {
    return null;
  }

  return null;
}

function normalizeLink(item, idx) {
  if (!item || !item.url || !item.title) return null;
  const videoId = item.videoId || extractVideoId(item.url);
  if (!videoId) return null;

  return {
    id: item.id || `video-${idx}`,
    title: String(item.title),
    notes: String(item.notes || ""),
    url: String(item.url),
    videoId: String(videoId),
  };
}

export default function YouTube() {
  const [links, setLinks] = useState([]);
  const [status, setStatus] = useState("Loading link library...");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("./youtube-links.json", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) {
            setLinks([]);
            setStatus("No repository video list found yet. Add public/youtube-links.json and redeploy.");
          }
          return;
        }

        const parsed = await response.json();
        const next = Array.isArray(parsed)
          ? parsed.map((item, idx) => normalizeLink(item, idx)).filter(Boolean)
          : [];

        if (!cancelled) {
          setLinks(next);
          setStatus(next.length ? "" : "No YouTube links listed yet.");
        }
      } catch (_error) {
        if (!cancelled) {
          setLinks([]);
          setStatus("Could not load YouTube links.");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const embedLinks = useMemo(() => links.filter((item) => item.videoId), [links]);

  return (
    <>
      <section className="hero art-hero">
        <p className="eyebrow">YouTube</p>
        <h1>Video index for sharing your work.</h1>
        <p className="lead">
          Add permanent links in <code>public/youtube-links.json</code>. This page reads that file
          and publishes every listed video.
        </p>
      </section>

      <section className="youtube-page">
        <div className="youtube-intro">
          <h2>Publish flow</h2>
          <ol>
            <li>Edit <code>public/youtube-links.json</code>.</li>
            <li>Commit and push.</li>
            <li>GitHub Pages redeploys and updates this page.</li>
          </ol>
          {status && <p className="muted">{status}</p>}
        </div>

        <div className="youtube-grid">
          {embedLinks.map((item) => (
            <article key={item.id} className="youtube-card">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${item.videoId}`}
                title={item.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
              <h3>{item.title}</h3>
              <p>{item.notes || "No notes."}</p>
              <a className="pill" href={item.url} target="_blank" rel="noreferrer">
                Open on YouTube
              </a>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
