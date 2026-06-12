import assert from "node:assert/strict";
import test from "node:test";
import {
  blocksToMarkdown,
  buildHtmlExport,
  buildMarkdownExport,
  estimateAiCredits,
  markdownToBlocks
} from "./editor.js";

test("markdownToBlocks detects common structured blocks", () => {
  const blocks = markdownToBlocks(`## Heading
- [ ] Task
> Note`);

  assert.deepEqual(blocks.map((block) => block.type), ["h2", "check", "quote"]);
});

test("blocksToMarkdown preserves heading and checklist syntax", () => {
  const markdown = blocksToMarkdown([
    { type: "h2", text: "Heading" },
    { type: "check", text: "Task" }
  ]);

  assert.equal(markdown, "## Heading\n- [ ] Task");
});

test("exports include document and diagram source", () => {
  const markdown = buildMarkdownExport({
    title: "Auth",
    markdown: "Body",
    diagramDsl: "A -> B"
  });

  assert.match(markdown, /# Auth/);
  assert.match(markdown, /```drawai/);
});

test("html export escapes markup", () => {
  const html = buildHtmlExport({ title: "<Auth>", markdown: "<script>" });

  assert.match(html, /&lt;Auth&gt;/);
  assert.match(html, /&lt;script&gt;/);
});

test("estimateAiCredits scales with prompt length", () => {
  assert.ok(estimateAiCredits("short") < estimateAiCredits("x".repeat(600)));
});
