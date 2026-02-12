import { useEffect, useMemo, useRef, useState } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useNavigate } from "react-router-dom";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

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

function createPageKey(prefix = "page") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 7)}`;
}

const ZOOM_LEVELS = [0.75, 1, 1.25, 1.5, 2, 2.5];

function toNumber(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function unwrapCalc(value) {
  const text = String(value || "").trim();
  if (text.startsWith("calc(") && text.endsWith(")")) {
    return text.slice(5, -1);
  }
  return text;
}

function zoomedCssLength(baseValue, zoom) {
  const zoomFactor = clampNumber(toNumber(zoom, 1), 0.4, 4);
  if (Math.abs(zoomFactor - 1) < 0.001) return baseValue;
  const inner = unwrapCalc(baseValue) || "0px";
  return `calc((${inner}) * ${zoomFactor})`;
}

function scaleCanvasPaths(paths, factor) {
  const scale = toNumber(factor, 1);
  if (!Array.isArray(paths) || !Number.isFinite(scale) || Math.abs(scale - 1) < 0.00001) {
    return Array.isArray(paths) ? paths : [];
  }

  return paths.map((entry) => {
    if (!entry || typeof entry !== "object" || !Array.isArray(entry.paths)) return entry;
    return {
      ...entry,
      paths: entry.paths.map((point) => ({
        x: toNumber(point?.x, 0) * scale,
        y: toNumber(point?.y, 0) * scale,
      })),
    };
  });
}

function normalizeWhiteboard(whiteboard) {
  const entry = whiteboard && typeof whiteboard === "object" ? whiteboard : {};
  const fallbackPaths = Array.isArray(entry.paths) ? entry.paths : [];

  const rawDrawings = entry.pageDrawings && typeof entry.pageDrawings === "object" ? entry.pageDrawings : {};
  const pageDrawings = {};

  Object.entries(rawDrawings).forEach(([key, paths]) => {
    if (!key) return;
    pageDrawings[key] = Array.isArray(paths) ? paths : [];
  });

  if (!Object.keys(pageDrawings).length) {
    pageDrawings["page-1"] = fallbackPaths;
  }

  const pageOrder = Array.isArray(entry.pageOrder)
    ? entry.pageOrder.filter((key) => typeof key === "string" && key && pageDrawings[key])
    : [];

  Object.keys(pageDrawings).forEach((key) => {
    if (!pageOrder.includes(key)) {
      pageOrder.push(key);
    }
  });

  if (!pageOrder.length) {
    pageOrder.push("page-1");
    pageDrawings["page-1"] = [];
  }

  const pageLabels = {};
  const rawLabels = entry.pageLabels && typeof entry.pageLabels === "object" ? entry.pageLabels : {};
  pageOrder.forEach((key, idx) => {
    const fromData = String(rawLabels[key] || "").trim();
    pageLabels[key] = fromData || `Page ${idx + 1}`;
  });

  const activePageKey = pageOrder.includes(entry.activePageKey) ? entry.activePageKey : pageOrder[0];

  return {
    id: String(entry.id || ""),
    title: String(entry.title || ""),
    author: String(entry.author || ""),
    paths: pageDrawings[activePageKey] || [],
    pageDrawings,
    pageOrder,
    pageLabels,
    activePageKey,
    createdAt: String(entry.createdAt || ""),
    updatedAt: String(entry.updatedAt || ""),
  };
}

function emptyBoardTemplate() {
  return normalizeWhiteboard({
    id: "",
    title: "",
    author: "",
    paths: [],
    pageDrawings: {
      "page-1": [],
    },
    pageOrder: ["page-1"],
    pageLabels: {
      "page-1": "Page 1",
    },
    activePageKey: "page-1",
    createdAt: "",
    updatedAt: "",
  });
}

export default function SchoolWhiteboard({
  initialBoards,
  initialBoardId = "",
  boardsLoading = false,
  boardsError = "",
  standalone = false,
}) {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const isHydratingPathsRef = useRef(false);
  const activeBoardRef = useRef(emptyBoardTemplate());
  const zoomRef = useRef(1);
  const initialBoardIdRef = useRef("");

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
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [isExpanded, setIsExpanded] = useState(() => Boolean(standalone));
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pdfFitMode, setPdfFitMode] = useState("fit");

  const [pageBackgrounds, setPageBackgrounds] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    activeBoardRef.current = activeBoard;
  }, [activeBoard]);

  useEffect(() => {
    zoomRef.current = zoomLevel;
  }, [zoomLevel]);

  useEffect(() => {
    if (!standalone) return;
    setIsExpanded(true);
  }, [standalone]);

  useEffect(() => {
    const nextId = String(initialBoardId || "").trim();
    if (!nextId) return;
    if (nextId === initialBoardIdRef.current) return;
    initialBoardIdRef.current = nextId;
    setActiveBoardId(nextId);
  }, [initialBoardId]);

  useEffect(() => {
    const next = sortBoards(initialBoards);
    setBoards(next);
    if (!activeBoardId && next.length) {
      setActiveBoardId(next[0]?.id || "");
    }
  }, [initialBoards, activeBoardId]);

  useEffect(() => {
    if (!canvasRef.current) return;
    canvasRef.current.eraseMode(isEraserMode);
  }, [isEraserMode]);

  useEffect(() => {
    if (!isExpanded) {
      document.body.style.removeProperty("overflow");
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.removeProperty("overflow");
    };
  }, [isExpanded]);

  async function hydrateCanvas(paths, zoomOverride) {
    if (!canvasRef.current) return;

    const zoom = Number.isFinite(zoomOverride) ? zoomOverride : zoomRef.current;
    const scaledPaths = scaleCanvasPaths(Array.isArray(paths) ? paths : [], zoom);

    isHydratingPathsRef.current = true;
    canvasRef.current.resetCanvas();

    if (scaledPaths.length > 0) {
      canvasRef.current.loadPaths(scaledPaths);
    }

    await new Promise((resolve) => window.setTimeout(resolve, 50));
    isHydratingPathsRef.current = false;
  }

  async function exportCurrentPathsRaw() {
    if (!canvasRef.current) return [];

    try {
      const paths = await canvasRef.current.exportPaths();
      return Array.isArray(paths) ? paths : [];
    } catch (_error) {
      return [];
    }
  }

  async function exportCurrentPathsCanonical() {
    const raw = await exportCurrentPathsRaw();
    const zoom = clampNumber(zoomRef.current, 0.4, 4);
    return scaleCanvasPaths(raw, 1 / zoom);
  }

  async function commitCurrentPageToState(baseBoard) {
    const board = normalizeWhiteboard(baseBoard || activeBoardRef.current);
    const paths = await exportCurrentPathsCanonical();
    const pageDrawings = {
      ...board.pageDrawings,
      [board.activePageKey]: paths,
    };

    return {
      ...board,
      pageDrawings,
      paths,
    };
  }

  async function openPage(nextPageKey) {
    const current = normalizeWhiteboard(activeBoardRef.current);
    if (!nextPageKey || !current.pageOrder.includes(nextPageKey)) return;
    if (nextPageKey === current.activePageKey) return;

    const withCurrent = await commitCurrentPageToState(current);
    const nextPaths = withCurrent.pageDrawings[nextPageKey] || [];
    const nextBoard = {
      ...withCurrent,
      activePageKey: nextPageKey,
      paths: nextPaths,
    };

    setActiveBoard(nextBoard);
    setPathCount(nextPaths.length);
    await hydrateCanvas(nextPaths);
  }

  async function applyZoom(nextZoomValue) {
    const nextZoom = clampNumber(toNumber(nextZoomValue, 1), ZOOM_LEVELS[0], ZOOM_LEVELS[ZOOM_LEVELS.length - 1]);
    const previousZoom = clampNumber(zoomRef.current, 0.4, 4);
    if (Math.abs(nextZoom - previousZoom) < 0.001) return;

    if (!canvasRef.current || !activeBoardId) {
      zoomRef.current = nextZoom;
      setZoomLevel(nextZoom);
      return;
    }

    const board = normalizeWhiteboard(activeBoardRef.current);
    const raw = await exportCurrentPathsRaw();
    const canonical = scaleCanvasPaths(raw, 1 / previousZoom);
    const pageDrawings = {
      ...board.pageDrawings,
      [board.activePageKey]: canonical,
    };
    const nextBoard = {
      ...board,
      pageDrawings,
      paths: canonical,
    };

    setActiveBoard(nextBoard);
    setPathCount(canonical.length);

    zoomRef.current = nextZoom;
    setZoomLevel(nextZoom);
    await hydrateCanvas(canonical, nextZoom);
  }

  function stepZoom(direction) {
    const current = zoomLevel;
    const idx = ZOOM_LEVELS.findIndex((value) => Math.abs(value - current) < 0.001);
    const currentIdx = idx === -1 ? ZOOM_LEVELS.findIndex((value) => Math.abs(value - 1) < 0.001) : idx;
    const nextIdx = clampNumber(currentIdx + direction, 0, ZOOM_LEVELS.length - 1);
    applyZoom(ZOOM_LEVELS[nextIdx]);
  }

  function openFullPage() {
    if (!activeBoardId) {
      setErrorMessage("Select a whiteboard first.");
      return;
    }
    navigate(`/whiteboard?id=${encodeURIComponent(activeBoardId)}`);
  }

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

      const whiteboard = normalizeWhiteboard(payload?.whiteboard || emptyBoardTemplate());
      setActiveBoard(whiteboard);
      setBoardAuthor(whiteboard.author || "");
      setPathCount((whiteboard.pageDrawings[whiteboard.activePageKey] || []).length);
      setPageBackgrounds({});
      setDirty(false);

      await hydrateCanvas(whiteboard.pageDrawings[whiteboard.activePageKey] || []);
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
          pageDrawings: {
            "page-1": [],
          },
          pageOrder: ["page-1"],
          pageLabels: {
            "page-1": "Page 1",
          },
          activePageKey: "page-1",
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
      const current = await commitCurrentPageToState(activeBoardRef.current);
      const [previewImage] = await Promise.all([canvasRef.current.exportImage("png")]);

      const response = await fetch("/api/school/whiteboards", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: activeBoardId,
          title: current.title,
          author: boardAuthor.trim() || "Member",
          pageDrawings: current.pageDrawings,
          pageOrder: current.pageOrder,
          pageLabels: current.pageLabels,
          activePageKey: current.activePageKey,
          paths: current.paths,
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
        setBoards((currentBoards) => sortBoards([summary, ...currentBoards.filter((item) => item.id !== summary.id)]));
      }
      if (payload?.whiteboard) {
        const normalized = normalizeWhiteboard(payload.whiteboard);
        setActiveBoard(normalized);
        setPathCount((normalized.pageDrawings[normalized.activePageKey] || []).length);
      }
      setDirty(false);
      setStatusMessage("Whiteboard saved to database.");
    } catch (_error) {
      setErrorMessage("Could not save whiteboard.");
    } finally {
      setSaving(false);
    }
  }

  async function exportPng() {
    if (!canvasRef.current || !activeBoardId) return;
    setErrorMessage("");

    try {
      const image = await canvasRef.current.exportImage("png");
      const activeLabel = activeBoard.pageLabels?.[activeBoard.activePageKey] || activeBoard.activePageKey || "page";
      downloadDataUrl(`${slugify(activeBoard.title || "whiteboard")}-${slugify(activeLabel)}.png`, image);
      setStatusMessage("Current page PNG exported.");
    } catch (_error) {
      setErrorMessage("Could not export PNG.");
    }
  }

  async function exportJson() {
    if (!activeBoardId || !canvasRef.current) return;
    setErrorMessage("");

    try {
      const current = await commitCurrentPageToState(activeBoardRef.current);
      const payload = {
        id: current.id,
        title: current.title,
        author: boardAuthor || current.author || "Member",
        exportedAt: new Date().toISOString(),
        pageDrawings: current.pageDrawings,
        pageOrder: current.pageOrder,
        pageLabels: current.pageLabels,
        activePageKey: current.activePageKey,
      };
      downloadText(`${slugify(current.title || "whiteboard")}.json`, JSON.stringify(payload, null, 2));
      setStatusMessage("Board JSON exported.");
    } catch (_error) {
      setErrorMessage("Could not export JSON.");
    }
  }

  async function addBlankPage() {
    if (!activeBoardId) {
      setErrorMessage("Create or select a whiteboard first.");
      return;
    }

    const current = await commitCurrentPageToState(activeBoardRef.current);
    const newKey = createPageKey("page");
    const nextOrder = [...current.pageOrder, newKey];
    const nextBoard = {
      ...current,
      pageDrawings: {
        ...current.pageDrawings,
        [newKey]: [],
      },
      pageOrder: nextOrder,
      pageLabels: {
        ...current.pageLabels,
        [newKey]: `Page ${nextOrder.length}`,
      },
      activePageKey: newKey,
      paths: [],
    };

    setActiveBoard(nextBoard);
    setPathCount(0);
    setDirty(true);
    await hydrateCanvas([]);
  }

  async function uploadPdfBackground(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!activeBoardId) {
      setErrorMessage("Create or select a whiteboard first.");
      event.target.value = "";
      return;
    }

    setErrorMessage("");
    setStatusMessage("");
    setLoadingPdf(true);

    try {
      const current = await commitCurrentPageToState(activeBoardRef.current);
      const buffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;

      const pageDrawings = {
        ...current.pageDrawings,
      };
      const pageOrder = [...current.pageOrder];
      const pageLabels = {
        ...current.pageLabels,
      };
      const backgrounds = {};

      const baseKey = createPageKey("pdf");

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.35 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: false });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        if (!context) continue;

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        const pageKey = `${baseKey}-${pageNumber}`;
        backgrounds[pageKey] = canvas.toDataURL("image/jpeg", 0.9);
        pageDrawings[pageKey] = [];
        pageOrder.push(pageKey);
        pageLabels[pageKey] = `${file.name} - Page ${pageNumber}`;
      }

      const firstNewKey = pageOrder.find((key) => backgrounds[key]);
      const activePageKey = firstNewKey || current.activePageKey;
      const nextBoard = {
        ...current,
        pageDrawings,
        pageOrder,
        pageLabels,
        activePageKey,
        paths: pageDrawings[activePageKey] || [],
      };

      setPageBackgrounds((previous) => ({
        ...previous,
        ...backgrounds,
      }));
      setActiveBoard(nextBoard);
      setPathCount((nextBoard.pageDrawings[nextBoard.activePageKey] || []).length);
      setDirty(true);
      await hydrateCanvas(nextBoard.pageDrawings[nextBoard.activePageKey] || []);

      setStatusMessage(`Loaded ${pdf.numPages} PDF pages from ${file.name}.`);
    } catch (_error) {
      setErrorMessage("Could not read that PDF. Try a smaller or standard PDF file.");
    } finally {
      setLoadingPdf(false);
      event.target.value = "";
    }
  }

  function clearPdfBackgrounds() {
    setPageBackgrounds({});
    setStatusMessage("PDF page backgrounds cleared for this session.");
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

  const currentPageBackground = activeBoard.activePageKey ? pageBackgrounds[activeBoard.activePageKey] || "" : "";
  const baseCanvasHeight = isExpanded ? "clamp(420px, calc(100vh - 360px), 960px)" : "460px";
  const zoomedCanvasWidth = zoomLevel === 1 ? "100%" : `calc(100% * ${zoomLevel})`;
  const zoomedCanvasHeight = zoomedCssLength(baseCanvasHeight, zoomLevel);
  const preserveBackgroundImageAspectRatio =
    pdfFitMode === "fill" ? "xMidYMid slice" : pdfFitMode === "stretch" ? "none" : "xMidYMid meet";

  return (
    <section className={`school-whiteboards ${isExpanded ? "is-expanded" : ""} ${standalone ? "is-standalone" : ""}`.trim()}>
      <div className="school-section-header">
        <p className="eyebrow">Whiteboard Studio</p>
        <h2>Sketch, save, annotate PDFs, and export</h2>
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

          <div className="school-form">
            <p className="filter-label">Background PDF</p>
            <input type="file" accept="application/pdf" onChange={uploadPdfBackground} disabled={loadingPdf || !activeBoardId} />
            <div className="whiteboard-actions">
              <button className="pill" type="button" onClick={addBlankPage} disabled={!activeBoardId}>
                Add blank page
              </button>
              <button className="pill" type="button" onClick={clearPdfBackgrounds} disabled={!Object.keys(pageBackgrounds).length}>
                Clear PDF backgrounds
              </button>
            </div>
            <p className="muted">Upload adds each PDF page as an annotatable whiteboard page.</p>
          </div>

          <div className="whiteboard-list">
            {boardsLoading ? <p className="muted">Loading whiteboards...</p> : null}
            {boardsError ? <p className="auth-error">{boardsError}</p> : null}
            {boards.length === 0 && !boardsLoading ? <p className="muted">No whiteboards yet.</p> : null}
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
                  <span>{entry.pageCount || 1} pages</span>
                </div>
                <div className="whiteboard-list-item-meta">
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
              <label className="filter-label" htmlFor="whiteboard-page-picker">
                Page
              </label>
              <select
                id="whiteboard-page-picker"
                value={activeBoard.activePageKey || ""}
                onChange={(event) => openPage(event.target.value)}
                disabled={!activeBoardId}
              >
                {activeBoard.pageOrder.map((key, idx) => (
                  <option key={key} value={key}>
                    {activeBoard.pageLabels[key] || `Page ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="whiteboard-toolbar-group">
              <label className="filter-label" htmlFor="whiteboard-zoom">
                Zoom
              </label>
              <button
                className="pill"
                type="button"
                onClick={() => stepZoom(-1)}
                disabled={zoomLevel <= ZOOM_LEVELS[0]}
                aria-label="Zoom out"
              >
                -
              </button>
              <select id="whiteboard-zoom" value={String(zoomLevel)} onChange={(event) => applyZoom(Number(event.target.value))}>
                {ZOOM_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {Math.round(level * 100)}%
                  </option>
                ))}
              </select>
              <button
                className="pill"
                type="button"
                onClick={() => stepZoom(1)}
                disabled={zoomLevel >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                className="pill"
                type="button"
                onClick={() => applyZoom(1)}
                disabled={Math.abs(zoomLevel - 1) < 0.001}
              >
                Fit
              </button>
            </div>

            <div className="whiteboard-toolbar-group">
              <label className="filter-label" htmlFor="whiteboard-pdf-fit">
                PDF fit
              </label>
              <select id="whiteboard-pdf-fit" value={pdfFitMode} onChange={(event) => setPdfFitMode(event.target.value)}>
                <option value="fit">Fit</option>
                <option value="fill">Fill</option>
                <option value="stretch">Stretch</option>
              </select>
            </div>

            <div className="whiteboard-toolbar-group">
              <button className="pill" type="button" onClick={() => canvasRef.current?.undo()}>
                Undo
              </button>
              <button className="pill" type="button" onClick={() => canvasRef.current?.redo()}>
                Redo
              </button>
              <button className="pill" type="button" onClick={clearCanvas}>
                Clear page
              </button>
            </div>

            {standalone ? (
              <div className="whiteboard-toolbar-group">
                <button className="pill" type="button" onClick={() => navigate("/school")}>
                  Back to School
                </button>
              </div>
            ) : (
              <div className="whiteboard-toolbar-group">
                <button className="pill" type="button" onClick={openFullPage} disabled={!activeBoardId}>
                  Open full page
                </button>
                <button className="pill" type="button" onClick={() => setIsExpanded((prev) => !prev)}>
                  {isExpanded ? "Exit large mode" : "Open large mode"}
                </button>
              </div>
            )}
          </div>

          <div className="whiteboard-canvas-wrap" style={{ height: baseCanvasHeight }}>
            <ReactSketchCanvas
              ref={canvasRef}
              className="whiteboard-canvas"
              width={zoomedCanvasWidth}
              height={zoomedCanvasHeight}
              canvasColor="#fff"
              backgroundImage={currentPageBackground}
              preserveBackgroundImageAspectRatio={preserveBackgroundImageAspectRatio}
              exportWithBackgroundImage
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
                {activeBoardMeta?.author || activeBoard.author || "Member"} · {pathCount} strokes on this page · {activeBoard.pageOrder.length} total pages {dirty ? "· unsaved changes" : ""}
              </span>
            </div>

            <div className="whiteboard-actions">
              <button className="pill" type="button" onClick={saveBoard} disabled={saving || !activeBoardId}>
                {saving ? "Saving..." : "Save to database"}
              </button>
              <button className="pill" type="button" onClick={exportPng} disabled={!activeBoardId}>
                Export PNG page
              </button>
              <button className="pill" type="button" onClick={exportJson} disabled={!activeBoardId}>
                Export board JSON
              </button>
            </div>
          </div>

          {loadingBoard ? <p className="muted">Loading whiteboard...</p> : null}
          {loadingPdf ? <p className="muted">Rendering PDF pages for annotation...</p> : null}
          {statusMessage ? <p className="muted">{statusMessage}</p> : null}
          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}
        </article>
      </div>
    </section>
  );
}
