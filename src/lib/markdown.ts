/**
 * Lightweight conversion of plain text / Markdown into HTML for the editor.
 * Supports headings, bold, italic, unordered/ordered lists, and paragraphs.
 */
export function textOrMarkdownToHtml(raw: string): string {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return "<p></p>";
  }

  const lines = normalized.split("\n");
  const blocks: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  const flushList = () => {
    if (!listType || listItems.length === 0) {
      listType = null;
      listItems = [];
      return;
    }
    const tag = listType;
    blocks.push(
      `<${tag}>${listItems.map((item) => `<li>${item}</li>`).join("")}</${tag}>`,
    );
    listType = null;
    listItems = [];
  };

  const inlineFormat = (text: string): string => {
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/_(.+?)_/g, "<em>$1</em>");
  };

  for (const line of lines) {
    const headingMatch = /^(#{1,2})\s+(.*)$/.exec(line);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      blocks.push(`<h${level}>${inlineFormat(headingMatch[2])}</h${level}>`);
      continue;
    }

    const unorderedMatch = /^[-*]\s+(.*)$/.exec(line);
    if (unorderedMatch) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listItems.push(inlineFormat(unorderedMatch[1]));
      continue;
    }

    const orderedMatch = /^\d+\.\s+(.*)$/.exec(line);
    if (orderedMatch) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listItems.push(inlineFormat(orderedMatch[1]));
      continue;
    }

    flushList();

    if (line.trim() === "") {
      continue;
    }

    blocks.push(`<p>${inlineFormat(line)}</p>`);
  }

  flushList();
  return blocks.join("") || "<p></p>";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function filenameToTitle(filename: string): string {
  return filename.replace(/\.(txt|md)$/i, "").trim() || "Imported Document";
}
