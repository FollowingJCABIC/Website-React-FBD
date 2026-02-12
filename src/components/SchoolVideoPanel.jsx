import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function SchoolVideoPanel({ classroomName }) {
  const navigate = useNavigate();
  const [roomInput, setRoomInput] = useState(() => {
    const base = slugify(classroomName) || "learning-circle";
    return `${base}-office-hours`;
  });
  const [isOpen, setIsOpen] = useState(false);

  const roomSlug = useMemo(() => slugify(roomInput) || "learning-circle-office-hours", [roomInput]);
  const iframeUrl = `https://meet.jit.si/${roomSlug}#config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.prejoinPageEnabled=false`;
  const roomUrl = `https://meet.jit.si/${roomSlug}`;

  function openPopout() {
    if (typeof window === "undefined") return;
    const base = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    const url = `${base}#/meet?room=${encodeURIComponent(roomSlug)}`;
    window.open(url, "lds-meeting", "popup=yes,width=420,height=640,left=80,top=80");
  }

  return (
    <section className="school-video-panel">
      <div className="school-section-header">
        <p className="eyebrow">Meeting Panel</p>
        <h2>One-on-one video room (scales to groups)</h2>
      </div>

      <div className="video-panel-grid">
        <div className="video-panel-controls">
          <label className="filter-label" htmlFor="video-room">
            Room name
          </label>
          <input
            id="video-room"
            value={roomInput}
            onChange={(event) => setRoomInput(event.target.value)}
            placeholder="learning-circle-office-hours"
          />
          <div className="video-panel-actions">
            <button className="pill" type="button" onClick={() => setIsOpen((prev) => !prev)}>
              {isOpen ? "Hide video panel" : "Open video panel"}
            </button>
            <button className="pill" type="button" onClick={() => navigate(`/meet?room=${encodeURIComponent(roomSlug)}`)}>
              Open full page
            </button>
            <button className="pill" type="button" onClick={openPopout}>
              Pop out window
            </button>
            <a className="pill" href={roomUrl} target="_blank" rel="noreferrer">
              Open room in new tab
            </a>
          </div>
          <p className="muted">
            Share this room link with your student for quick sessions:
            <br />
            {roomUrl}
          </p>
        </div>

        <div className="video-panel-frame-wrap">
          {isOpen ? (
            <iframe
              className="video-panel-frame"
              src={iframeUrl}
              title="School meeting panel"
              allow="camera; microphone; display-capture; fullscreen"
              loading="lazy"
            />
          ) : (
            <div className="video-panel-placeholder">
              <p>Open panel to start an embedded meeting.</p>
            </div>
          )}
        </div>
      </div>

      <div className="video-infra-notes">
        <p className="filter-label">Infrastructure path</p>
        <p>Now: Jitsi room supports your one-student use case with zero backend setup.</p>
        <p>Next: move to Daily/LiveKit/Twilio if you need attendance, recordings, moderation, and analytics.</p>
        <p>Scale: add role-based room creation plus scheduled session objects in your School database.</p>
      </div>
    </section>
  );
}
