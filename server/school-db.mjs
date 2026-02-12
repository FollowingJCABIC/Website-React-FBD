import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_CLASSROOM = {
  name: "Learning Circle",
  description:
    "A private class stream for assignments, announcements, shared resources, and questions.",
  inviteCode: "LEARN-WITH-ME",
  meetingSchedule: "Flexible schedule. Use announcements for live sessions.",
};

const DEFAULT_DB = {
  classroom: DEFAULT_CLASSROOM,
  announcements: [
    {
      id: "announcement-welcome",
      title: "Welcome to Learning Circle",
      message: "Start by reading the resources list, then pick one assignment to begin this week.",
      author: "Instructor",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  assignments: [
    {
      id: "assignment-first-reflection",
      title: "First Reflection",
      description: "Write one paragraph about what you want to learn this month.",
      dueDate: "",
      points: 10,
      author: "Instructor",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  resources: [
    {
      id: "resource-community-guide",
      title: "Community Study Guide",
      description: "A shared document to track topics and weekly goals.",
      url: "https://example.com/study-guide",
      type: "Guide",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  questions: [],
  whiteboards: [],
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function cloneDefaultDb() {
  return JSON.parse(JSON.stringify(DEFAULT_DB));
}

function schoolDbPath() {
  const fromEnv = String(process.env.SCHOOL_DB_PATH || "").trim();
  if (fromEnv) return fromEnv;
  return path.join("/tmp", "lastday-school-db.json");
}

function sanitizeString(value, maxLength = 600) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.slice(0, maxLength);
}

function sanitizeDate(value) {
  const date = sanitizeString(value, 20);
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function sanitizeUrl(value) {
  const text = sanitizeString(value, 500);
  if (!text) return "";

  try {
    const parsed = new URL(text);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return parsed.toString();
  } catch (_error) {
    return "";
  }
}

function sanitizeNumber(value, fallback, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function sanitizePageKey(value) {
  const text = String(value || "").trim().slice(0, 80);
  if (!text) return "";
  return text.replace(/[^a-zA-Z0-9:_-]/g, "-");
}

function sanitizeStrokeColor(value) {
  const color = sanitizeString(value, 24);
  if (!color) return "#111111";
  if (/^#[0-9a-fA-F]{3,8}$/.test(color)) return color;
  if (/^rgba?\([^)]{1,24}\)$/.test(color)) return color;
  return "#111111";
}

function sanitizeDataUrlImage(value) {
  const image = String(value || "").trim();
  if (!image) return "";
  if (image.length > 650_000) return "";
  if (!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/i.test(image)) return "";
  return image;
}

function sanitizeWhiteboardPaths(value) {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, 350)
    .map((pathEntry) => {
      const points = Array.isArray(pathEntry?.paths)
        ? pathEntry.paths
            .slice(0, 2400)
            .map((point) => ({
              x: sanitizeNumber(point?.x, 0, -100_000, 100_000),
              y: sanitizeNumber(point?.y, 0, -100_000, 100_000),
            }))
            .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
        : [];

      if (!points.length) return null;

      return {
        paths: points,
        strokeWidth: sanitizeNumber(pathEntry?.strokeWidth, 4, 1, 60),
        strokeColor: sanitizeStrokeColor(pathEntry?.strokeColor),
        drawMode: Boolean(pathEntry?.drawMode),
      };
    })
    .filter(Boolean);
}

function sanitizePageDrawings(value, fallbackPaths) {
  const next = {};

  if (value && typeof value === "object" && !Array.isArray(value)) {
    Object.entries(value).forEach(([key, paths]) => {
      const safeKey = sanitizePageKey(key);
      if (!safeKey) return;
      next[safeKey] = sanitizeWhiteboardPaths(paths);
    });
  }

  if (!Object.keys(next).length) {
    const fallback = sanitizeWhiteboardPaths(fallbackPaths);
    next["page-1"] = fallback;
  }

  return next;
}

function sanitizePageOrder(value, drawings) {
  const drawingKeys = Object.keys(drawings);
  if (!Array.isArray(value)) return drawingKeys;

  const deduped = [];
  value.forEach((entry) => {
    const key = sanitizePageKey(entry);
    if (!key) return;
    if (!drawingKeys.includes(key)) return;
    if (!deduped.includes(key)) {
      deduped.push(key);
    }
  });

  drawingKeys.forEach((key) => {
    if (!deduped.includes(key)) {
      deduped.push(key);
    }
  });

  return deduped.length ? deduped : drawingKeys;
}

function sanitizePageLabels(value, pageOrder) {
  const labels = {};
  const raw = value && typeof value === "object" && !Array.isArray(value) ? value : {};

  pageOrder.forEach((key, idx) => {
    const label = sanitizeString(raw[key], 120) || `Page ${idx + 1}`;
    labels[key] = label;
  });

  return labels;
}

function sanitizeWhiteboard(entry) {
  const pageDrawings = sanitizePageDrawings(entry?.pageDrawings, entry?.paths);
  const pageOrder = sanitizePageOrder(entry?.pageOrder, pageDrawings);
  const pageLabels = sanitizePageLabels(entry?.pageLabels, pageOrder);
  const activePageKeyCandidate = sanitizePageKey(entry?.activePageKey);
  const activePageKey = pageOrder.includes(activePageKeyCandidate)
    ? activePageKeyCandidate
    : pageOrder[0];
  const activePaths = pageDrawings[activePageKey] || [];

  return {
    id: sanitizeString(entry?.id, 80),
    title: sanitizeString(entry?.title, 120) || "Untitled Whiteboard",
    author: sanitizeString(entry?.author, 60) || "Member",
    paths: activePaths,
    pageDrawings,
    pageOrder,
    pageLabels,
    activePageKey,
    previewImage: sanitizeDataUrlImage(entry?.previewImage),
    createdAt: sanitizeString(entry?.createdAt, 40),
    updatedAt: sanitizeString(entry?.updatedAt, 40),
  };
}

function toWhiteboardSummary(entry) {
  const totalPathCount = Object.values(entry.pageDrawings || {}).reduce(
    (total, paths) => total + (Array.isArray(paths) ? paths.length : 0),
    0
  );

  return {
    id: entry.id,
    title: entry.title,
    author: entry.author,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    pathCount: totalPathCount,
    pageCount: Array.isArray(entry.pageOrder) ? entry.pageOrder.length : 1,
    activePageKey: entry.activePageKey || "",
    previewImage: entry.previewImage || "",
  };
}

function normalizeDbShape(raw) {
  const safe = cloneDefaultDb();
  if (!raw || typeof raw !== "object") return safe;

  if (raw.classroom && typeof raw.classroom === "object") {
    safe.classroom = {
      name: sanitizeString(raw.classroom.name, 80) || safe.classroom.name,
      description: sanitizeString(raw.classroom.description, 280) || safe.classroom.description,
      inviteCode: sanitizeString(raw.classroom.inviteCode, 30) || safe.classroom.inviteCode,
      meetingSchedule:
        sanitizeString(raw.classroom.meetingSchedule, 200) || safe.classroom.meetingSchedule,
    };
  }

  safe.announcements = Array.isArray(raw.announcements)
    ? raw.announcements
        .map((item) => ({
          id: sanitizeString(item?.id, 80),
          title: sanitizeString(item?.title, 120),
          message: sanitizeString(item?.message, 1200),
          author: sanitizeString(item?.author, 60),
          createdAt: sanitizeString(item?.createdAt, 40),
        }))
        .filter((item) => item.id && item.title && item.message)
    : safe.announcements;

  safe.assignments = Array.isArray(raw.assignments)
    ? raw.assignments
        .map((item) => ({
          id: sanitizeString(item?.id, 80),
          title: sanitizeString(item?.title, 120),
          description: sanitizeString(item?.description, 1200),
          dueDate: sanitizeDate(item?.dueDate),
          points: Number.isFinite(Number(item?.points)) ? Number(item.points) : 0,
          author: sanitizeString(item?.author, 60),
          createdAt: sanitizeString(item?.createdAt, 40),
        }))
        .filter((item) => item.id && item.title)
    : safe.assignments;

  safe.resources = Array.isArray(raw.resources)
    ? raw.resources
        .map((item) => ({
          id: sanitizeString(item?.id, 80),
          title: sanitizeString(item?.title, 120),
          description: sanitizeString(item?.description, 500),
          url: sanitizeUrl(item?.url),
          type: sanitizeString(item?.type, 40) || "Resource",
          createdAt: sanitizeString(item?.createdAt, 40),
        }))
        .filter((item) => item.id && item.title && item.url)
    : safe.resources;

  safe.questions = Array.isArray(raw.questions)
    ? raw.questions
        .map((item) => ({
          id: sanitizeString(item?.id, 80),
          author: sanitizeString(item?.author, 60),
          message: sanitizeString(item?.message, 1200),
          createdAt: sanitizeString(item?.createdAt, 40),
        }))
        .filter((item) => item.id && item.author && item.message)
    : safe.questions;

  safe.whiteboards = Array.isArray(raw.whiteboards)
    ? raw.whiteboards.map((entry) => sanitizeWhiteboard(entry)).filter((entry) => entry.id)
    : safe.whiteboards;

  safe.whiteboards.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  safe.updatedAt = sanitizeString(raw.updatedAt, 40) || safe.updatedAt;
  return safe;
}

export function readSchoolDb() {
  try {
    const raw = fs.readFileSync(schoolDbPath(), "utf8");
    const parsed = JSON.parse(raw);
    return normalizeDbShape(parsed);
  } catch (_error) {
    const seed = cloneDefaultDb();
    writeSchoolDb(seed);
    return seed;
  }
}

export function writeSchoolDb(nextState) {
  const normalized = normalizeDbShape(nextState);
  const filePath = schoolDbPath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(normalized, null, 2), "utf8");
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;
}

export function addAnnouncement({ title, message, author }) {
  const now = new Date().toISOString();
  const db = readSchoolDb();

  const item = {
    id: createId("announcement"),
    title: sanitizeString(title, 120),
    message: sanitizeString(message, 1200),
    author: sanitizeString(author, 60) || "Instructor",
    createdAt: now,
  };

  db.announcements = [item, ...db.announcements].slice(0, 60);
  db.updatedAt = now;
  writeSchoolDb(db);
  return item;
}

export function addAssignment({ title, description, dueDate, points, author }) {
  const now = new Date().toISOString();
  const db = readSchoolDb();

  const item = {
    id: createId("assignment"),
    title: sanitizeString(title, 120),
    description: sanitizeString(description, 1200),
    dueDate: sanitizeDate(dueDate),
    points: Number.isFinite(Number(points)) ? Math.max(0, Math.round(Number(points))) : 0,
    author: sanitizeString(author, 60) || "Instructor",
    createdAt: now,
  };

  db.assignments = [item, ...db.assignments].slice(0, 120);
  db.updatedAt = now;
  writeSchoolDb(db);
  return item;
}

export function addResource({ title, description, url, type }) {
  const now = new Date().toISOString();
  const db = readSchoolDb();

  const item = {
    id: createId("resource"),
    title: sanitizeString(title, 120),
    description: sanitizeString(description, 500),
    url: sanitizeUrl(url),
    type: sanitizeString(type, 40) || "Resource",
    createdAt: now,
  };

  db.resources = [item, ...db.resources].slice(0, 120);
  db.updatedAt = now;
  writeSchoolDb(db);
  return item;
}

export function addQuestion({ author, message }) {
  const now = new Date().toISOString();
  const db = readSchoolDb();

  const item = {
    id: createId("question"),
    author: sanitizeString(author, 60) || "Member",
    message: sanitizeString(message, 1200),
    createdAt: now,
  };

  db.questions = [item, ...db.questions].slice(0, 200);
  db.updatedAt = now;
  writeSchoolDb(db);
  return item;
}

export function listWhiteboards() {
  const db = readSchoolDb();
  return db.whiteboards.map((entry) => toWhiteboardSummary(entry));
}

export function getWhiteboard(id) {
  const whiteboardId = sanitizeString(id, 80);
  if (!whiteboardId) return null;

  const db = readSchoolDb();
  const found = db.whiteboards.find((entry) => entry.id === whiteboardId);
  if (!found) return null;

  return sanitizeWhiteboard(found);
}

export function createWhiteboard({
  title,
  author,
  paths,
  pageDrawings,
  pageOrder,
  pageLabels,
  activePageKey,
  previewImage,
}) {
  const now = new Date().toISOString();
  const db = readSchoolDb();

  const whiteboard = sanitizeWhiteboard({
    id: createId("whiteboard"),
    title: sanitizeString(title, 120) || "Untitled Whiteboard",
    author: sanitizeString(author, 60) || "Member",
    paths: sanitizeWhiteboardPaths(paths),
    pageDrawings,
    pageOrder,
    pageLabels,
    activePageKey,
    previewImage: sanitizeDataUrlImage(previewImage),
    createdAt: now,
    updatedAt: now,
  });

  db.whiteboards = [whiteboard, ...db.whiteboards].slice(0, 120);
  db.updatedAt = now;
  writeSchoolDb(db);

  return {
    whiteboard,
    summary: toWhiteboardSummary(whiteboard),
  };
}

export function saveWhiteboard({
  id,
  title,
  author,
  paths,
  pageDrawings,
  pageOrder,
  pageLabels,
  activePageKey,
  previewImage,
}) {
  const whiteboardId = sanitizeString(id, 80);
  if (!whiteboardId) return null;

  const now = new Date().toISOString();
  const db = readSchoolDb();
  const index = db.whiteboards.findIndex((entry) => entry.id === whiteboardId);
  if (index === -1) return null;

  const existing = db.whiteboards[index];
  const nextTitle = sanitizeString(title, 120) || existing.title || "Untitled Whiteboard";
  const nextAuthor = sanitizeString(author, 60) || existing.author || "Member";

  const nextPageDrawings =
    pageDrawings && typeof pageDrawings === "object" && !Array.isArray(pageDrawings)
      ? sanitizePageDrawings(pageDrawings, [])
      : sanitizePageDrawings(existing.pageDrawings, existing.paths);
  const nextPageOrder = sanitizePageOrder(pageOrder, nextPageDrawings);
  const nextPageLabels = sanitizePageLabels(pageLabels || existing.pageLabels, nextPageOrder);
  const nextActivePageKey = nextPageOrder.includes(sanitizePageKey(activePageKey))
    ? sanitizePageKey(activePageKey)
    : existing.activePageKey || nextPageOrder[0];

  if (Array.isArray(paths)) {
    const fallbackKey = nextActivePageKey || nextPageOrder[0] || "page-1";
    nextPageDrawings[fallbackKey] = sanitizeWhiteboardPaths(paths);
  }

  const nextPaths = nextPageDrawings[nextActivePageKey] || [];
  let nextPreview = existing.previewImage || "";
  if (typeof previewImage === "string") {
    const normalizedPreview = sanitizeDataUrlImage(previewImage);
    nextPreview = previewImage.trim() ? normalizedPreview : "";
  }

  const nextWhiteboard = sanitizeWhiteboard({
    ...existing,
    title: nextTitle,
    author: nextAuthor,
    paths: nextPaths,
    pageDrawings: nextPageDrawings,
    pageOrder: nextPageOrder,
    pageLabels: nextPageLabels,
    activePageKey: nextActivePageKey,
    previewImage: nextPreview,
    updatedAt: now,
  });

  db.whiteboards[index] = nextWhiteboard;
  db.whiteboards.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  db.updatedAt = now;
  writeSchoolDb(db);

  return {
    whiteboard: nextWhiteboard,
    summary: toWhiteboardSummary(nextWhiteboard),
  };
}
