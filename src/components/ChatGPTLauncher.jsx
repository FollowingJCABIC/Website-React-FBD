export default function ChatGPTLauncher() {
  return (
    <div className="gpt-launcher-shell" aria-label="ChatGPT launcher">
      <a
        className="gpt-launcher"
        href="https://chatgpt.com/"
        target="_blank"
        rel="noreferrer"
        aria-label="Open ChatGPT in a new tab"
        title="Open ChatGPT (use your own account)"
      >
        <span className="gpt-launcher-badge" aria-hidden="true">
          GPT
        </span>
        <span className="gpt-launcher-label">ChatGPT</span>
      </a>
    </div>
  );
}

