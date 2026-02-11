import fs from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "src", "content");
const PDF_LIBRARY_PATH = path.join(process.cwd(), "src", "content", "pdfs.json");

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

function normalizeEntry(raw, index, sourceName = "") {
  const { meta, body } = parseFrontmatter(raw);
  const tags = String(meta.tags || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return {
    id: meta.id || `${sourceName || "entry"}-${index}`,
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

export function loadEntries() {
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((name) => name.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));

  const entries = files.map((file, index) => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
    return normalizeEntry(raw, index, file.replace(/\.md$/, ""));
  });

  return entries.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function loadPublicMeditations() {
  return loadEntries()
    .filter((entry) => entry.category === "religious")
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      date: entry.date,
      summary: entry.summary,
      hero: entry.hero,
    }));
}

export function loadPdfLibrary() {
  try {
    const raw = fs.readFileSync(PDF_LIBRARY_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (_error) {
    // Fall through to empty shape.
  }

  return {
    religious: [],
    art: [],
    mathematics: [],
    talk: [],
  };
}
