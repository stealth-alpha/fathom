import test from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown, renderInline, extractHeadings } from "../src/markdown.js";

test("renders headings with anchors", () => {
  const html = renderMarkdown("# Hello\n\n## World");
  assert.match(html, /<h1 id="hello">/);
  assert.match(html, /<h2 id="world">/);
});

test("renders lists without nesting", () => {
  const html = renderMarkdown("- one\n- two\n- three");
  assert.equal((html.match(/<ul>/g) || []).length, 1);
  assert.match(html, /<li>one<\/li>/);
});

test("renders ordered lists", () => {
  const html = renderMarkdown("1. first\n2. second");
  assert.match(html, /<ol>/);
  assert.match(html, /<li>first<\/li>/);
});

test("renders fenced code blocks with a language label", () => {
  const html = renderMarkdown("```js\nconst x = 1;\n```");
  assert.match(html, /code-lang">js<\/div>/);
  assert.match(html, /<code>const x = 1;<\/code>/);
  assert.ok(!html.includes("&lt;"));
});

test("renders tables", () => {
  const md = "| a | b |\n| --- | --- |\n| 1 | 2 |";
  const html = renderMarkdown(md);
  assert.match(html, /<table>/);
  assert.match(html, /<th>a<\/th>/);
  assert.match(html, /<td>2<\/td>/);
});

test("renders blockquotes", () => {
  const html = renderMarkdown("> a quote\n> continues");
  assert.match(html, /<blockquote>/);
  assert.match(html, /a quote/);
});

test("escapes HTML in source text", () => {
  const html = renderMarkdown("This is `<script>` text");
  assert.ok(!html.includes("<script>"));
  assert.match(html, /&lt;script&gt;/);
});

test("inline formatting works", () => {
  assert.equal(renderInline("**bold** and *italic*"), "<strong>bold</strong> and <em>italic</em>");
  assert.equal(renderInline("`code`"), "<code>code</code>");
  assert.equal(renderInline("[link](https://x.dev)"), '<a href="https://x.dev">link</a>');
});

test("extractHeadings returns slug + level", () => {
  const headings = extractHeadings("# One\n\n## Two\n\n### Three");
  assert.deepEqual(headings, [
    { level: 1, text: "One", slug: "one" },
    { level: 2, text: "Two", slug: "two" },
    { level: 3, text: "Three", slug: "three" },
  ]);
});
