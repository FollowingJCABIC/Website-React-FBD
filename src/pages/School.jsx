import { useEffect, useMemo, useState } from "react";
import { formatDate } from "../lib/date.js";
import SchoolWhiteboard from "../components/SchoolWhiteboard.jsx";

const ROLE_FULL = "full";
const ASSIGNMENT_PROGRESS_KEY = "lds-school-assignment-progress-v1";

const EMPTY_SCHOOL = {
  classroom: {
    name: "Learning Circle",
    description: "Private classroom workspace",
    inviteCode: "LEARN-WITH-ME",
    meetingSchedule: "Set by announcements",
  },
  announcements: [],
  assignments: [],
  resources: [],
  questions: [],
  whiteboards: [],
  updatedAt: "",
};

function readAssignmentProgress() {
  try {
    const raw = window.localStorage.getItem(ASSIGNMENT_PROGRESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch (_error) {
    return {};
  }

  return {};
}

function formatDateTime(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString();
}

function normalizeSchool(payload) {
  if (!payload || typeof payload !== "object") return EMPTY_SCHOOL;
  return {
    classroom: payload.classroom && typeof payload.classroom === "object" ? payload.classroom : EMPTY_SCHOOL.classroom,
    announcements: Array.isArray(payload.announcements) ? payload.announcements : [],
    assignments: Array.isArray(payload.assignments) ? payload.assignments : [],
    resources: Array.isArray(payload.resources) ? payload.resources : [],
    questions: Array.isArray(payload.questions) ? payload.questions : [],
    whiteboards: Array.isArray(payload.whiteboards) ? payload.whiteboards : [],
    updatedAt: typeof payload.updatedAt === "string" ? payload.updatedAt : "",
  };
}

function isSafeHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch (_error) {
    return false;
  }
}

async function readJsonSafe(response) {
  try {
    return await response.json();
  } catch (_error) {
    return {};
  }
}

export default function School({ authRole }) {
  const canManageSchool = authRole === ROLE_FULL;

  const [school, setSchool] = useState(EMPTY_SCHOOL);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [assignmentProgress, setAssignmentProgress] = useState(() => readAssignmentProgress());

  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [announcementError, setAnnouncementError] = useState("");

  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState("");
  const [assignmentPoints, setAssignmentPoints] = useState("10");
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");

  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceDescription, setResourceDescription] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceType, setResourceType] = useState("Guide");
  const [resourceSaving, setResourceSaving] = useState(false);
  const [resourceError, setResourceError] = useState("");

  const [questionAuthor, setQuestionAuthor] = useState("");
  const [questionMessage, setQuestionMessage] = useState("");
  const [questionSaving, setQuestionSaving] = useState(false);
  const [questionError, setQuestionError] = useState("");

  const sortedAssignments = useMemo(
    () =>
      [...school.assignments].sort((a, b) => {
        const aDate = a?.dueDate ? Date.parse(a.dueDate) : Number.MAX_SAFE_INTEGER;
        const bDate = b?.dueDate ? Date.parse(b.dueDate) : Number.MAX_SAFE_INTEGER;
        return aDate - bDate;
      }),
    [school.assignments]
  );

  useEffect(() => {
    window.localStorage.setItem(ASSIGNMENT_PROGRESS_KEY, JSON.stringify(assignmentProgress));
  }, [assignmentProgress]);

  async function fetchSchoolData() {
    setLoadError("");
    try {
      const response = await fetch("/api/school", {
        credentials: "include",
      });
      const payload = await readJsonSafe(response);

      if (!response.ok) {
        setSchool(EMPTY_SCHOOL);
        setLoadError(payload?.error || "Could not load school data.");
        return;
      }

      setSchool(normalizeSchool(payload?.school));
    } catch (_error) {
      setSchool(EMPTY_SCHOOL);
      setLoadError("Could not load school data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSchoolData();
  }, []);

  function toggleAssignmentComplete(assignmentId) {
    setAssignmentProgress((current) => ({
      ...current,
      [assignmentId]: !current[assignmentId],
    }));
  }

  async function createAnnouncement(event) {
    event.preventDefault();
    setAnnouncementError("");

    const title = announcementTitle.trim();
    const message = announcementMessage.trim();
    if (!title || !message) {
      setAnnouncementError("Title and message are required.");
      return;
    }

    setAnnouncementSaving(true);
    try {
      const response = await fetch("/api/school/announcements", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          message,
          author: "Instructor",
        }),
      });
      const payload = await readJsonSafe(response);

      if (!response.ok) {
        setAnnouncementError(payload?.error || "Could not post announcement.");
        return;
      }

      setSchool((current) => ({
        ...current,
        announcements: [payload.announcement, ...current.announcements],
        updatedAt: payload?.announcement?.createdAt || current.updatedAt,
      }));
      setAnnouncementTitle("");
      setAnnouncementMessage("");
    } catch (_error) {
      setAnnouncementError("Could not post announcement.");
    } finally {
      setAnnouncementSaving(false);
    }
  }

  async function createAssignment(event) {
    event.preventDefault();
    setAssignmentError("");

    const title = assignmentTitle.trim();
    if (!title) {
      setAssignmentError("Assignment title is required.");
      return;
    }

    setAssignmentSaving(true);
    try {
      const response = await fetch("/api/school/assignments", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description: assignmentDescription.trim(),
          dueDate: assignmentDueDate,
          points: Number.parseInt(assignmentPoints || "0", 10) || 0,
          author: "Instructor",
        }),
      });
      const payload = await readJsonSafe(response);

      if (!response.ok) {
        setAssignmentError(payload?.error || "Could not create assignment.");
        return;
      }

      setSchool((current) => ({
        ...current,
        assignments: [payload.assignment, ...current.assignments],
        updatedAt: payload?.assignment?.createdAt || current.updatedAt,
      }));
      setAssignmentTitle("");
      setAssignmentDescription("");
      setAssignmentDueDate("");
      setAssignmentPoints("10");
    } catch (_error) {
      setAssignmentError("Could not create assignment.");
    } finally {
      setAssignmentSaving(false);
    }
  }

  async function createResource(event) {
    event.preventDefault();
    setResourceError("");

    const title = resourceTitle.trim();
    const url = resourceUrl.trim();
    if (!title || !url) {
      setResourceError("Resource title and URL are required.");
      return;
    }

    if (!isSafeHttpUrl(url)) {
      setResourceError("Please use a valid http or https link.");
      return;
    }

    setResourceSaving(true);
    try {
      const response = await fetch("/api/school/resources", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description: resourceDescription.trim(),
          url,
          type: resourceType.trim() || "Resource",
        }),
      });
      const payload = await readJsonSafe(response);

      if (!response.ok) {
        setResourceError(payload?.error || "Could not add resource.");
        return;
      }

      setSchool((current) => ({
        ...current,
        resources: [payload.resource, ...current.resources],
        updatedAt: payload?.resource?.createdAt || current.updatedAt,
      }));
      setResourceTitle("");
      setResourceDescription("");
      setResourceUrl("");
      setResourceType("Guide");
    } catch (_error) {
      setResourceError("Could not add resource.");
    } finally {
      setResourceSaving(false);
    }
  }

  async function submitQuestion(event) {
    event.preventDefault();
    setQuestionError("");

    const message = questionMessage.trim();
    if (!message) {
      setQuestionError("Question text is required.");
      return;
    }

    setQuestionSaving(true);
    try {
      const response = await fetch("/api/school/questions", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          author: questionAuthor.trim() || "Member",
          message,
        }),
      });
      const payload = await readJsonSafe(response);

      if (!response.ok) {
        setQuestionError(payload?.error || "Could not submit question.");
        return;
      }

      setSchool((current) => ({
        ...current,
        questions: [payload.question, ...current.questions],
        updatedAt: payload?.question?.createdAt || current.updatedAt,
      }));
      setQuestionMessage("");
    } catch (_error) {
      setQuestionError("Could not submit question.");
    } finally {
      setQuestionSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="locked-zone">
        <p className="eyebrow">School</p>
        <h2>Loading classroom...</h2>
      </section>
    );
  }

  return (
    <>
      <section className="hero school-hero">
        <p className="eyebrow">School</p>
        <h1>{school.classroom.name || "Learning Circle"}</h1>
        <p className="lead">
          {school.classroom.description ||
            "Private class stream for shared assignments, resources, and questions."}
        </p>
        <p className="lead about">
          Invite code: <strong>{school.classroom.inviteCode || "LEARN-WITH-ME"}</strong> ·{" "}
          {school.classroom.meetingSchedule || "Schedule posted in announcements."}
        </p>
        {school.updatedAt ? <p className="muted">Last updated: {formatDateTime(school.updatedAt)}</p> : null}
      </section>

      {loadError ? (
        <section className="locked-zone">
          <h2>Could not load school data.</h2>
          <p>{loadError}</p>
          <button className="pill" type="button" onClick={fetchSchoolData}>
            Retry
          </button>
        </section>
      ) : null}

      <section className="school-layout">
        <article className="school-stream">
          <div className="school-section-header">
            <p className="eyebrow">Class Stream</p>
            <h2>Announcements</h2>
          </div>

          <div className="school-list">
            {school.announcements.length === 0 ? <p className="muted">No announcements yet.</p> : null}
            {school.announcements.map((item) => (
              <div key={item.id} className="school-card">
                <div className="school-card-header">
                  <h3>{item.title}</h3>
                  <span className="chip">{item.author || "Instructor"}</span>
                </div>
                <p>{item.message}</p>
                <p className="muted">{formatDateTime(item.createdAt)}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="school-assignments">
          <div className="school-section-header">
            <p className="eyebrow">Assignments</p>
            <h2>Upcoming work</h2>
          </div>

          <div className="school-list">
            {sortedAssignments.length === 0 ? <p className="muted">No assignments yet.</p> : null}
            {sortedAssignments.map((item) => {
              const done = Boolean(assignmentProgress[item.id]);
              return (
                <div key={item.id} className={`school-card ${done ? "is-done" : ""}`}>
                  <div className="school-card-header">
                    <h3>{item.title}</h3>
                    <span className="chip">{item.points || 0} pts</span>
                  </div>
                  {item.description ? <p>{item.description}</p> : null}
                  <div className="school-card-actions">
                    <span className="muted">
                      {item.dueDate ? `Due ${formatDate(item.dueDate)}` : "No due date"}
                    </span>
                    <button className={`pill ${done ? "active" : ""}`} type="button" onClick={() => toggleAssignmentComplete(item.id)}>
                      {done ? "Marked done" : "Mark done"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="school-layout">
        <article className="school-resources">
          <div className="school-section-header">
            <p className="eyebrow">Resources</p>
            <h2>Shared materials</h2>
          </div>
          <div className="school-list">
            {school.resources.length === 0 ? <p className="muted">No resources yet.</p> : null}
            {school.resources.map((item) => (
              <div key={item.id} className="school-card">
                <div className="school-card-header">
                  <h3>{item.title}</h3>
                  <span className="chip">{item.type || "Resource"}</span>
                </div>
                {item.description ? <p>{item.description}</p> : null}
                <a className="pill" href={item.url} target="_blank" rel="noreferrer">
                  Open resource
                </a>
              </div>
            ))}
          </div>
        </article>

        <article className="school-questions">
          <div className="school-section-header">
            <p className="eyebrow">Question Board</p>
            <h2>Ask and answer together</h2>
          </div>

          <form className="school-form" onSubmit={submitQuestion}>
            <label className="filter-label" htmlFor="question-author">
              Name (optional)
            </label>
            <input
              id="question-author"
              value={questionAuthor}
              onChange={(event) => setQuestionAuthor(event.target.value)}
              placeholder="Your name"
            />
            <label className="filter-label" htmlFor="question-message">
              Question
            </label>
            <textarea
              id="question-message"
              rows={4}
              value={questionMessage}
              onChange={(event) => setQuestionMessage(event.target.value)}
              placeholder="Ask your class a question..."
            />
            <button className="pill" type="submit" disabled={questionSaving}>
              {questionSaving ? "Posting..." : "Post question"}
            </button>
            {questionError ? <p className="auth-error">{questionError}</p> : null}
          </form>

          <div className="school-list">
            {school.questions.length === 0 ? <p className="muted">No questions yet.</p> : null}
            {school.questions.map((item) => (
              <div key={item.id} className="school-card">
                <div className="school-card-header">
                  <h3>{item.author || "Member"}</h3>
                  <span className="chip">Question</span>
                </div>
                <p>{item.message}</p>
                <p className="muted">{formatDateTime(item.createdAt)}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <SchoolWhiteboard initialBoards={school.whiteboards} />

      {canManageSchool ? (
        <section className="school-teacher-tools">
          <div className="school-section-header">
            <p className="eyebrow">Instructor Tools</p>
            <h2>Manage your class</h2>
          </div>

          <div className="school-tools-grid">
            <form className="school-form" onSubmit={createAnnouncement}>
              <p className="filter-label">New announcement</p>
              <input
                value={announcementTitle}
                onChange={(event) => setAnnouncementTitle(event.target.value)}
                placeholder="Announcement title"
              />
              <textarea
                rows={4}
                value={announcementMessage}
                onChange={(event) => setAnnouncementMessage(event.target.value)}
                placeholder="Write your class update..."
              />
              <button className="pill" type="submit" disabled={announcementSaving}>
                {announcementSaving ? "Publishing..." : "Publish announcement"}
              </button>
              {announcementError ? <p className="auth-error">{announcementError}</p> : null}
            </form>

            <form className="school-form" onSubmit={createAssignment}>
              <p className="filter-label">New assignment</p>
              <input
                value={assignmentTitle}
                onChange={(event) => setAssignmentTitle(event.target.value)}
                placeholder="Assignment title"
              />
              <textarea
                rows={3}
                value={assignmentDescription}
                onChange={(event) => setAssignmentDescription(event.target.value)}
                placeholder="Instructions"
              />
              <div className="school-inline-fields">
                <input
                  type="date"
                  value={assignmentDueDate}
                  onChange={(event) => setAssignmentDueDate(event.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={assignmentPoints}
                  onChange={(event) => setAssignmentPoints(event.target.value)}
                  placeholder="Points"
                />
              </div>
              <button className="pill" type="submit" disabled={assignmentSaving}>
                {assignmentSaving ? "Saving..." : "Create assignment"}
              </button>
              {assignmentError ? <p className="auth-error">{assignmentError}</p> : null}
            </form>

            <form className="school-form" onSubmit={createResource}>
              <p className="filter-label">New resource</p>
              <input
                value={resourceTitle}
                onChange={(event) => setResourceTitle(event.target.value)}
                placeholder="Resource title"
              />
              <input
                value={resourceUrl}
                onChange={(event) => setResourceUrl(event.target.value)}
                placeholder="https://..."
              />
              <textarea
                rows={3}
                value={resourceDescription}
                onChange={(event) => setResourceDescription(event.target.value)}
                placeholder="Short description"
              />
              <input
                value={resourceType}
                onChange={(event) => setResourceType(event.target.value)}
                placeholder="Type (Guide, Video, Worksheet...)"
              />
              <button className="pill" type="submit" disabled={resourceSaving}>
                {resourceSaving ? "Saving..." : "Add resource"}
              </button>
              {resourceError ? <p className="auth-error">{resourceError}</p> : null}
            </form>
          </div>
        </section>
      ) : null}
    </>
  );
}
