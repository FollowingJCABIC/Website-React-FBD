import { useMemo, useState } from "react";

async function readJsonSafe(response) {
  try {
    return await response.json();
  } catch (_error) {
    return {};
  }
}

function buildPromptSuggestions() {
  return [
    "Where should I go for class whiteboard and PDF annotation?",
    "How do I find art entries and art PDFs?",
    "What is available only for full access users?",
    "Where can I start a student meeting session?",
  ];
}

export default function FullAccessAssistant() {
  const [messages, setMessages] = useState([
    {
      id: "assistant-intro",
      role: "assistant",
      content: "Full-access assistant is ready. Ask about navigation, features, or where to find content.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const promptSuggestions = useMemo(() => buildPromptSuggestions(), []);

  async function askAssistant(question) {
    const text = String(question || "").trim();
    if (!text || sending) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setSending(true);
    setError("");

    try {
      const history = [...messages, userMessage]
        .filter((item) => item.role === "user" || item.role === "assistant")
        .slice(-8)
        .map((item) => ({
          role: item.role,
          content: item.content,
        }));

      const response = await fetch("/api/assistant", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          history,
        }),
      });
      const payload = await readJsonSafe(response);

      if (!response.ok) {
        setError(payload?.error || "Assistant request failed.");
        return;
      }

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: String(payload?.answer || "I could not generate a response."),
      };
      setMessages((current) => [...current, assistantMessage]);
    } catch (_error) {
      setError("Assistant request failed.");
    } finally {
      setSending(false);
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    askAssistant(input);
  }

  return (
    <section className="full-assistant">
      <div className="full-assistant-header">
        <p className="eyebrow">Full Access</p>
        <h2>Site Guide Assistant</h2>
        <p>Ask where to go, what features exist, and which page handles each task.</p>
      </div>

      <div className="assistant-prompts">
        {promptSuggestions.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="pill"
            onClick={() => askAssistant(prompt)}
            disabled={sending}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="assistant-thread" aria-live="polite">
        {messages.map((message) => (
          <article
            key={message.id}
            className={`assistant-message ${message.role === "assistant" ? "is-assistant" : "is-user"}`}
          >
            <p className="filter-label">{message.role === "assistant" ? "Assistant" : "You"}</p>
            <p>{message.content}</p>
          </article>
        ))}
      </div>

      <form className="assistant-form" onSubmit={onSubmit}>
        <label className="filter-label" htmlFor="assistant-input">
          Ask the site guide
        </label>
        <textarea
          id="assistant-input"
          rows={3}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Example: Where do I upload a PDF for annotation?"
          disabled={sending}
        />
        <button className="pill" type="submit" disabled={sending || !input.trim()}>
          {sending ? "Thinking..." : "Ask"}
        </button>
      </form>

      {error ? <p className="auth-error">{error}</p> : null}
    </section>
  );
}
