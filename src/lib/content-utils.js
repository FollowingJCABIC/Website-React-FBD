export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function inlineMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

export function renderMarkdown(markdown) {
  const lines = String(markdown || "").split("\n");
  const blocks = [];
  let currentList = null;

  const flushList = () => {
    if (!currentList) return;
    blocks.push(`<ul>${currentList.map((item) => `<li>${item}</li>`).join("")}</ul>`);
    currentList = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith("- ")) {
      const value = inlineMarkdown(escapeHtml(trimmed.slice(2)));
      if (!currentList) currentList = [];
      currentList.push(value);
      continue;
    }

    flushList();

    if (trimmed.startsWith("# ")) {
      blocks.push(`<h3>${inlineMarkdown(escapeHtml(trimmed.slice(2)))}</h3>`);
      continue;
    }

    if (trimmed.startsWith("## ")) {
      blocks.push(`<h4>${inlineMarkdown(escapeHtml(trimmed.slice(3)))}</h4>`);
      continue;
    }

    if (trimmed.startsWith("> ")) {
      blocks.push(`<blockquote>${inlineMarkdown(escapeHtml(trimmed.slice(2)))}</blockquote>`);
      continue;
    }

    blocks.push(`<p>${inlineMarkdown(escapeHtml(trimmed))}</p>`);
  }

  flushList();
  return blocks.join("");
}
