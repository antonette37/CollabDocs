import { describe, expect, it } from "vitest";
import { filenameToTitle, textOrMarkdownToHtml } from "../src/lib/markdown";

describe("textOrMarkdownToHtml", () => {
  it("converts headings, lists, and emphasis", () => {
    const html = textOrMarkdownToHtml(
      `# Title\n\nHello **world**\n\n- one\n- two\n\n1. first\n2. second`,
    );

    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>world</strong>");
    expect(html).toContain("<ul><li>one</li><li>two</li></ul>");
    expect(html).toContain("<ol><li>first</li><li>second</li></ol>");
  });

  it("escapes HTML entities in imported text", () => {
    const html = textOrMarkdownToHtml(`<script>alert("x")</script>`);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
});

describe("filenameToTitle", () => {
  it("strips txt and md extensions", () => {
    expect(filenameToTitle("Sprint Notes.md")).toBe("Sprint Notes");
    expect(filenameToTitle("readme.txt")).toBe("readme");
  });
});
