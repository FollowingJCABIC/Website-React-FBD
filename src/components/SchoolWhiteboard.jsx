import { useEffect, useMemo, useRef, useState } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";

function readJsonSafe(response) {
  return response.json().catch(() => ({}));
}

function formatDateTime(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString();
}

function sortBoards(entries) {
  return [...(Array.isArray(entries) ? entries : [])].sort((a, b) => {
    const left = String(a?.updatedAt || "");
    const right = String(b?.updatedAt || "");
    if (left < right) return 1;
    if (left > right) return -1;
    return 0;
  });
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

function downloadDataUrl(filename, dataUrl) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}

function slugify(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "whiteboard";
  return text.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function emptyBoardTemplate() {
  return {
    id: "",
    title: "",
    author: "",
    paths: [],
    createdAt: "",
    updatedAt: "",
  };
}

export default function SchoolWhiteboard({ initialBoards }) {
  const canvasRef = useRef(null);
  const isHydratingPathsRef = useRef(false);

  const [boards, setBoards] = useState(() => sortBoards(initialBoards));
  const [activeBoardId, setActiveBoardId] = useState(() => sortBoards(initialBoards)[0]?.id || "");
  const [activeBoard, setActiveBoard] = useState(() => emptyBoardTemplate());

  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [boardAuthor, setBoardAuthor] = useState("");

  const [strokeColor, setStrokeColor] = useState("#ff2f3d");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isEraserMode, setIsEraserMode] = useState(false);

  const [pathCount, setPathCount] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingBoard, setLoadingBoard] = useState(false);

  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const next = sortBoards(initialBoards);
    setBoards(next);
    const hasActiveBoard = next.some((entry) => entry.id === activeBoardId);
    if (!hasActiveBoard) {
      setActiveBoardId(next[0]?.id || "");
    }
  }, [initialBoards, activeBoardId]);

  useEffect(() => {
    if (!canvasRef.current) return;
    canvasRef.current.eraseMode(isEraserMode);
  }, [isEraserMode]);

  async function loadBoard(id) {
    if (!id) return;
    setErrorMessage("");
    setStatusMessage("");
    setLoadingBoard(true);

    try {
      const response = await fetch(`/api/school/whiteboards?id=${encodeURIComponent(id)}`, {
        credentials: "include",
      });
      const payload = await readJsonSafe(response);

      if (!response.ok) {
        setErrorMessage(payload?.error || "Could not load whiteboard.");
        return;
      }

      const whiteboard = payload?.whiteboard || emptyBoardTemplate();
      setActiveBoard(whiteboard);
      setBoardAuthor(whiteboard.author || "");
      setPathCount(Array.isArray(whiteboard.paths) ? whiteboard.paths.length : 0);
      setDirty(false);

      if (canvasRef.current) {
        isHydratingPathsRef.current = true;
        canvasRef.current.resetCanvas();
        if (Array.isArray(whiteboard.paths) && whiteboard.paths.length > 0) {
          canvasRef.current.loadPaths(whiteboard.paths);
        }

        window.setTimeout(() => {
          isHydratingPathsRef.current = false;
        }, 50);
      }
    } catch (_error) {
      setErrorMessage("Could not load whiteboard.");
    } finally {
      setLoadingBoard(false);
    }
  }

  useEffect(() => {
    loadBoard(activeBoardId);
  }, [activeBoardId]);

  async function createBoard(event) {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    const title = newBoardTitle.trim();
    if (!title) {
      setErrorMessage("Whiteboard title is required.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/school/whiteboards", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          author: boardAuthor.trim() || "Member",
          paths: [],
        }),
      });
      const payload = await readJsonSafe(response);
      if (!response.ok) {
        setErrorMessage(payload?.error || "Could not create whiteboard.");
        return;
      }

      const summary = payload?.summary;
      if (summary?.id) {
        setBoards((current) => sortBoards([summary, ...current.filter((item) => item.id !== summary.id)]));
        setActiveBoardId(summary.id);
      }
      setNewBoardTitle("");
      setStatusMessage("Whiteboard created.");
    } catch (_error) {
      setErrorMessage("Could not create whiteboard.");
    } finally {
      setSaving(false);
    }
  }

  async function saveBoard() {
    if (!activeBoardId || !canvasRef.current) {
      setErrorMessage("Create or select a whiteboard first.");
      return;
    }

    setErrorMessage("");
    setStatusMessage("");
    setSaving(true);

    try {
      const [paths, previewImage] = await Promise.all([
        canvasRef.current.exportPaths(),
        canvasRef.current.exportImage("png"),
      ]);

      const response = await fetch("/api/school/whiteboards", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: activeBoardId,
          title: activeBoard.title,
          author: boardAuthor.trim() || "Member",
          paths,
          previewImage,
        }),
      });
      const payload = await readJsonSafe(response);
      if (!response.ok) {
        setErrorMessage(payload?.error || "Could not save whiteboard.");
        return;
      }

      const summary = payload?.summary;
      if (summary?.id) {
        setBoards((current) => sortBoards([summary, ...current.filter((item) => item.id !== summary.id)]));
      }
      if (payload?.whiteboard) {
        setActiveBoard(payload.whiteboard);
      }
      setPathCount(Array.isArray(paths) ? paths.length : 0);
      setDirty(false);
      setStatusMessage("Whiteboard saved to database.");
    } catch (_error) {
      setErrorMessage("Could not save whiteboard.");
    } finally {
      setSaving(false);
    }
  }

  async function exportPng() {
    if (!canvasRef.current) return;
    setErrorMessage("");
    try {
      const image = await canvasRef.current.exportImage("png");
      downloadDataUrl(`${slugify(activeBoard.title || "whiteboard")}.png`, image);
      setStatusMessage("PNG exported.");
    } catch (_error) {
      setErrorMessage("Could not export PNG.");
    }
  }

  async function exportJson() {
    if (!canvasRef.current) return;
    setErrorMessage("");
    try {
      const paths = await canvasRef.current.exportPaths();
      const payload = {
        id: activeBoard.id,
        title: activeBoard.title,
        author: boardAuthor || activeBoard.author || "Member",
        exportedAt: new Date().toISOString(),
        paths,
      };
      downloadText(`${slugify(activeBoard.title || "whiteboard")}.json`, JSON.stringify(payload, null, 2));
      setStatusMessage("JSON exported.");
    } catch (_error) {
      setErrorMessage("Could not export JSON.");
    }
  }

  function setPenMode() {
    setIsEraserMode(false);
  }

  function setEraseMode() {
    setIsEraserMode(true);
  }

  function clearCanvas() {
    if (!canvasRef.current) return;
    canvasRef.current.clearCanvas();
    setPathCount(0);
    setDirty(true);
  }

  function onCanvasChange(paths) {
    if (isHydratingPathsRef.current) return;
    setPathCount(Array.isArray(paths) ? paths.length : 0);
    setDirty(true);
  }

  const activeBoardMeta = useMemo(
    () => boards.find((entry) => entry.id === activeBoardId) || null,
    [boards, activeBoardId]
  );

  return (
    <section className="school-whiteboards">
      <div className="school-section-header">
        <p className="eyebrow">Whiteboard Studio</p>
        <h2>Sketch, save, and export</h2>
      </div>

      <div className="whiteboard-layout">
        <aside className="whiteboard-sidebar">
          <form className="school-form" onSubmit={createBoard}>
            <p className="filter-label">Create whiteboard</p>
            <input
              value={newBoardTitle}
              onChange={(event) => setNewBoardTitle(event.target.value)}
              placeholder="Board title"
            />
            <input
              value={boardAuthor}
              onChange={(event) => setBoardAuthor(event.target.value)}
              placeholder="Your name (optional)"
            />
            <button className="pill" type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create board"}
            </button>
          </form>

          <div className="whiteboard-list">
            {boards.length === 0 ? <p className="muted">No whiteboards yet.</p> : null}
            {boards.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={`whiteboard-list-item ${entry.id === activeBoardId ? "active" : ""}`}
                onClick={() => setActiveBoardId(entry.id)}
              >
                <div className="whiteboard-list-item-title">{entry.title || "Untitled Whiteboard"}</div>
                <div className="whiteboard-list-item-meta">
                  <span>{entry.pathCount || 0} strokes</span>
                  <span>{formatDateTime(entry.updatedAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <article className="whiteboard-workspace">
          <div className="whiteboard-toolbar">
            <div className="whiteboard-toolbar-group">
              <button
                className={`pill ${!isEraserMode ? "active" : ""}`}
                type="button"
                onClick={setPenMode}
              >
                Pen
              </button>
              <button
                className={`pill ${isEraserMode ? "active" : ""}`}
                type="button"
                onClick={setEraseMode}
              >
                Eraser
              </button>
            </div>

            <div className="whiteboard-toolbar-group">
              <label className="filter-label" htmlFor="whiteboard-color">
                Color
              </label>
              <input
                id="whiteboard-color"
                className="whiteboard-color-input"
                type="color"
                value={strokeColor}
                onChange={(event) => setStrokeColor(event.target.value)}
                disabled={isEraserMode}
              />
            </div>

            <div className="whiteboard-toolbar-group">
              <label className="filter-label" htmlFor="whiteboard-width">
                Width
              </label>
              <input
                id="whiteboard-width"
                type="range"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(event) => setStrokeWidth(Number.parseInt(event.target.value, 10) || 4)}
              />
            </div>

            <div className="whiteboard-toolbar-group">
              <button className="pill" type="button" onClick={() => canvasRef.current?.undo()}>
                Undo
              </button>
              <button className="pill" type="button" onClick={() => canvasRef.current?.redo()}>
                Redo
              </button>
              <button className="pill" type="button" onClick={clearCanvas}>
                Clear
              </button>
            </div>
          </div>

          <div className="whiteboard-canvas-wrap">
            <ReactSketchCanvas
              ref={canvasRef}
              className="whiteboard-canvas"
              width="100%"
              height="420px"
              canvasColor="#fff"
              strokeColor={strokeColor}
              strokeWidth={strokeWidth}
              eraserWidth={24}
              onChange={onCanvasChange}
            />
          </div>

          <div className="whiteboard-footer">
            <div className="whiteboard-meta">
              <input
                value={activeBoard.title || ""}
                onChange={(event) =>
                  setActiveBoard((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Whiteboard title"
                disabled={!activeBoardId}
              />
              <span className="muted">
                {activeBoardMeta?.author || activeBoard.author || "Member"} · {pathCount} strokes{" "}
                {dirty ? "· unsaved changes" : ""}
              </span>
            </div>

            <div className="whiteboard-actions">
              <button className="pill" type="button" onClick={saveBoard} disabled={saving || !activeBoardId}>
                {saving ? "Saving..." : "Save to database"}
              </button>
              <button className="pill" type="button" onClick={exportPng} disabled={!activeBoardId}>
                Export PNG
              </button>
              <button className="pill" type="button" onClick={exportJson} disabled={!activeBoardId}>
                Export JSON
              </button>
            </div>
          </div>

          {loadingBoard ? <p className="muted">Loading whiteboard...</p> : null}
          {statusMessage ? <p className="muted">{statusMessage}</p> : null}
          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}
        </article>
      </div>
    </section>
  );
}
