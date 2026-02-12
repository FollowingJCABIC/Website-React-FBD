import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SchoolWhiteboard from "../components/SchoolWhiteboard.jsx";

function readJsonSafe(response) {
  return response.json().catch(() => ({}));
}

export default function WhiteboardPage() {
  const [searchParams] = useSearchParams();
  const initialBoardId = String(searchParams.get("id") || "").trim();

  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBoards() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/school/whiteboards", { credentials: "include" });
        const payload = await readJsonSafe(response);

        if (cancelled) return;

        if (!response.ok) {
          setBoards([]);
          setError(payload?.error || "Could not load whiteboards.");
          return;
        }

        setBoards(Array.isArray(payload?.whiteboards) ? payload.whiteboards : []);
      } catch (_error) {
        if (cancelled) return;
        setBoards([]);
        setError("Could not load whiteboards.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBoards();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SchoolWhiteboard
      initialBoards={boards}
      initialBoardId={initialBoardId}
      boardsLoading={loading}
      boardsError={error}
      standalone
    />
  );
}

