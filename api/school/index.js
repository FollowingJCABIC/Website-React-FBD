import { ROLE_FULL, ROLE_VISITOR, readJsonBody, readSessionRole } from "../../server/auth.mjs";
import { loadEntries, loadPdfLibrary, loadPublicMeditations } from "../../server/content.mjs";
import { listWhiteboards, readSchoolDb } from "../../server/school-db.mjs";

const MAX_MESSAGE_LENGTH = 1200;
const MAX_HISTORY_ITEMS = 10;
const REQUEST_TIMEOUT_MS = 25_000;

function sanitizeText(value, maxLength = MAX_MESSAGE_LENGTH) {
  return String(value || "").trim().slice(0, maxLength);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildSiteSnapshot() {
  const entries = loadEntries();
  const meditations = loadPublicMeditations();
  const pdfLibrary = loadPdfLibrary();
  const school = readSchoolDb();

  const routes = [
    {
      path: "#/",
      name: "Home",
      access: "public",
      purpose: "Landing hub and route launcher.",
    },
    {
      path: "#/activities",
      name: "Activities",
      access: "visitor/full",
      purpose: "External activities and app links.",
    },
    {
      path: "#/reflections",
      name: "Reflections",
      access: "visitor/full",
      purpose: "Sacred media, liturgy notes, and daily thoughts.",
    },
    {
      path: "#/library",
      name: "Library",
      access: "full",
      purpose: "Articles, PDFs, and full-only assistant.",
    },
    {
      path: "#/art",
      name: "Art Hall",
      access: "visitor/full",
      purpose: "Art entries and art PDF browsing.",
    },
    {
      path: "#/youtube",
      name: "YouTube",
      access: "visitor/full",
      purpose: "YouTube link library and embedded videos.",
    },
    {
      path: "#/school",
      name: "School",
      access: "visitor/full",
      purpose:
        "Classroom announcements, assignments, resources, question board, multi-page whiteboard, and meeting panel.",
    },
  ];

  return {
    routes,
    authModel: {
      public: "No sign-in",
      visitor: "Can open member pages and apps",
      full: "Can access article/PDF library and manage School tools",
    },
    contentSummary: {
      articleCount: entries.length,
      meditationCount: meditations.length,
      latestEntries: entries.slice(0, 12).map((entry) => ({
        id: entry.id,
        title: entry.title,
        category: entry.category,
        date: entry.date,
        summary: entry.summary,
      })),
      pdfCounts: {
        religious: safeArray(pdfLibrary.religious).length,
        art: safeArray(pdfLibrary.art).length,
        mathematics: safeArray(pdfLibrary.mathematics).length,
        talk: safeArray(pdfLibrary.talk).length,
      },
    },
    schoolSummary: {
      classroomName: school?.classroom?.name || "Learning Circle",
      counts: {
        announcements: safeArray(school?.announcements).length,
        assignments: safeArray(school?.assignments).length,
        resources: safeArray(school?.resources).length,
        questions: safeArray(school?.questions).length,
        whiteboards: safeArray(school?.whiteboards).length,
      },
    },
  };
}

function answerWithLocalFallback(question) {
  const q = sanitizeText(question, 2000).toLowerCase();

  if (!q) {
    return "Ask me about navigation, School tools, articles, or where to find a feature.";
  }

  if (q.includes("school") || q.includes("whiteboard") || q.includes("assignment") || q.includes("meeting")) {
    return [
      "Use `#/school`.",
      "School includes announcements, assignments, resources, questions, multi-page whiteboard, and a meeting panel.",
      "Whiteboard tools include PDF page backgrounds, page switching, save to database, and PNG/JSON export.",
    ].join(" ");
  }

  if (q.includes("art")) {
    return "Use `#/art` for art entries and art PDFs. Full access reveals full article detail and library data.";
  }

  if (q.includes("youtube") || q.includes("video")) {
    return "Use `#/youtube` for the YouTube library. For live class calls, use the meeting panel on `#/school`.";
  }

  if (q.includes("pdf")) {
    return "Full users can browse the PDF library in `#/library` and annotate uploaded PDF pages in the School whiteboard.";
  }

  if (q.includes("login") || q.includes("sign in") || q.includes("full")) {
    return "Full login is required for Library and assistant access. Visitor unlocks member pages.";
  }

  return [
    "Main pages: `#/`, `#/activities`, `#/reflections`, `#/library`, `#/art`, `#/youtube`, `#/school`.",
    "Ask a specific question like: “Where do I upload PDF pages for whiteboard annotation?”",
  ].join(" ");
}

async function askOpenAI({ message, history, snapshot }) {
  const apiKey = sanitizeText(process.env.OPENAI_API_KEY || "", 300);
  if (!apiKey) {
    return {
      answer: answerWithLocalFallback(message),
      mode: "local_fallback",
    };
  }

  const model = sanitizeText(process.env.OPENAI_MODEL || "gpt-4o-mini", 100);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const cleanedHistory = safeArray(history)
    .slice(-MAX_HISTORY_ITEMS)
    .map((item) => ({
      role: item?.role === "assistant" ? "assistant" : "user",
      content: sanitizeText(item?.content, 1600),
    }))
    .filter((item) => item.content);

  const messages = [
    {
      role: "system",
      content:
        "You are a concise site navigator for Last Day Studio. Answer only using the site snapshot. If unsure, say what you cannot confirm.",
    },
    {
      role: "system",
      content: `Site snapshot:\n${JSON.stringify(snapshot)}`,
    },
    ...cleanedHistory,
    {
      role: "user",
      content: sanitizeText(message, MAX_MESSAGE_LENGTH),
    },
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages,
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        answer: answerWithLocalFallback(message),
        mode: "local_fallback",
      };
    }

    const answer = sanitizeText(payload?.choices?.[0]?.message?.content, 7000);
    if (!answer) {
      return {
        answer: answerWithLocalFallback(message),
        mode: "local_fallback",
      };
    }

    return {
      answer,
      mode: "openai",
      model,
    };
  } catch (_error) {
    return {
      answer: answerWithLocalFallback(message),
      mode: "local_fallback",
    };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  const role = readSessionRole(req);
  if (req.method === "GET") {
    if (![ROLE_VISITOR, ROLE_FULL].includes(role)) {
      res.status(403).json({ error: "Sign in is required" });
      return;
    }

    try {
      const school = readSchoolDb();
      const whiteboards = listWhiteboards();
      res.status(200).json({
        school: {
          ...school,
          whiteboards,
        },
      });
    } catch (_error) {
      res.status(500).json({ error: "Failed to load school data" });
    }
    return;
  }

  if (req.method === "POST") {
    if (role !== ROLE_FULL) {
      res.status(403).json({ error: "Full access is required" });
      return;
    }

    try {
      const body = await readJsonBody(req);
      const action = sanitizeText(body?.action, 80).toLowerCase();
      if (action !== "assistant") {
        res.status(400).json({ error: "Unsupported action" });
        return;
      }

      const message = sanitizeText(body?.message);
      if (!message) {
        res.status(400).json({ error: "Message is required" });
        return;
      }

      const history = safeArray(body?.history);
      const snapshot = buildSiteSnapshot();
      const result = await askOpenAI({ message, history, snapshot });

      res.status(200).json({
        answer: result.answer,
        mode: result.mode,
        model: result.model || "",
      });
      return;
    } catch (_error) {
      res.status(500).json({ error: "Assistant request failed" });
      return;
    }
  }

  res.status(405).json({ error: "Method not allowed" });
}
