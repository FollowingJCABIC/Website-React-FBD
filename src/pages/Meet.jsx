import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function copyText(value) {
  if (!value) return Promise.resolve(false);

  if (navigator?.clipboard?.writeText) {
    return navigator.clipboard
      .writeText(value)
      .then(() => true)
      .catch(() => false);
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return Promise.resolve(ok);
  } catch (_error) {
    return Promise.resolve(false);
  }
}

export default function MeetPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialRoom = String(searchParams.get("room") || "").trim();
  const [roomInput, setRoomInput] = useState(initialRoom || "learning-circle-office-hours");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!initialRoom) return;
    setRoomInput(initialRoom);
  }, [initialRoom]);

  const roomSlug = useMemo(() => slugify(roomInput) || "learning-circle-office-hours", [roomInput]);
  const iframeUrl = `https://meet.jit.si/${roomSlug}#config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.prejoinPageEnabled=false`;
  const roomUrl = `https://meet.jit.si/${roomSlug}`;

  async function onCopy() {
    const ok = await copyText(roomUrl);
    setCopied(ok);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function applyRoomToUrl() {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("room", roomSlug);
      return next;
    });
  }

  return (
    <div className="immersive-page">
      <header className="immersive-topbar">
        <button className="pill" type="button" onClick={() => navigate("/school")}>
          Back to School
        </button>
        <div className="immersive-topbar-title">
          <p className="filter-label">Meeting Window</p>
          <p className="muted">{roomSlug}</p>
        </div>
        <a className="pill" href={roomUrl} target="_blank" rel="noreferrer">
          Open Jitsi
        </a>
      </header>

      <section className="immersive-body">
        <div className="immersive-controls">
          <label className="filter-label" htmlFor="meet-room">
            Room name
          </label>
          <input
            id="meet-room"
            value={roomInput}
            onChange={(event) => setRoomInput(event.target.value)}
            placeholder="learning-circle-office-hours"
          />
          <div className="immersive-actions">
            <button className="pill" type="button" onClick={applyRoomToUrl}>
              Load room
            </button>
            <button className="pill" type="button" onClick={onCopy}>
              {copied ? "Copied link" : "Copy link"}
            </button>
          </div>
          <p className="muted">
            Share this link with a student:
            <br />
            {roomUrl}
          </p>
        </div>

        <div className="immersive-frame-wrap">
          <iframe
            className="immersive-frame"
            src={iframeUrl}
            title="School meeting window"
            allow="camera; microphone; display-capture; fullscreen"
            loading="lazy"
          />
        </div>
      </section>
    </div>
  );
}

